import mysql.connector
import random

import datetime
import os
import time
import sys
import typing

sys.path.append(os.path.abspath('../main_db'))
import common_db


class WorkerDB (common_db.DB):
    def get_pending_test(
            self, hostname: str
    ) -> typing.Optional[typing.Dict[str, typing.Any]]:
        """Returns a pending test to process or None if none found.

        Args:
            hostname: hostname of the worker.  This is used to decide whether to
                return mocknet tests and also is stored in the database to be
                able to cleanup the database on restarts.
        Returns:
            A build to process or None if none are present.
        """
        return self._with_transaction(lambda: self.__get_pending_test(hostname))

    def __get_pending_test(
            self, hostname: str
    ) -> typing.Optional[typing.Dict[str, typing.Any]]:
        """Implementation of get_pending_test method (which see).

        This method must be run inside of a transaction because it uses
        variables and so we cannot tolerate disconnects between the two queries.
        """
        after = int(time.time())
        if "mocknet" in hostname:
            sql = '''UPDATE tests t SET t.started = now(), t.status = 'RUNNING', t.hostname=%s  WHERE t.status = 'PENDING' and 
                     build_id in (select build_id from builds where status = 'SKIPPED') and
                     t.name LIKE '%mocknet%' and @tmp_id := t.test_id ORDER BY t.test_id LIMIT 1;'''
            vals =  (hostname,)
        else:
            sql = '''UPDATE tests AS t, 
            (SELECT test_id FROM tests WHERE status = 'PENDING' and   
                    build_id in (select build_id from builds where status = 'BUILD DONE' or status = 'SKIPPED') and
                name NOT LIKE '%mocknet%' and select_after < %s ORDER BY priority, test_id LIMIT 1) AS id 
                SET t.started = now(), t.status = 'RUNNING', t.hostname=%s WHERE t.test_id=id.test_id and 
                @tmp_id := id.test_id'''
            vals = (after, hostname)
        res = self._execute_sql(sql, vals)
        if res.rowcount == 0:
            return None
        sql = f'''SELECT t.test_id, t.run_id, t.build_id, r.sha, t.name, b.ip, b.is_release FROM tests t, runs r, builds b 
                  WHERE t.test_id = @tmp_id and t.run_id = r.id and  t.build_id = b.build_id'''
        result = self._execute_sql(sql, ())
        pending_test = result.fetchone()
        return pending_test

    def test_started(self, id):
        sql = "UPDATE tests SET started = now() WHERE test_id= %s"
        self._execute_sql(sql, (id,))

    def update_test_status(self, status, id):
        sql = "UPDATE tests SET finished = now(), status = %s WHERE test_id= %s"
        self._execute_sql(sql, (status, id))

    def save_short_logs(self, test_id: int, filename: str, file_size: int,
                        data: bytes, storage: str, stack_trace: bool,
                        found_patterns: str) -> None:
        self._insert('logs',
                     test_id=test_id,
                     type=filename,
                     size=file_size,
                     log=data,
                     storage=storage,
                     stack_trace=stack_trace,
                     patterns=found_patterns)

    def remark_test_pending(self, id):
        after = int(time.time()) + 3*60
        sql = "UPDATE tests SET started = null, hostname=null, status='PENDING', select_after=%s WHERE test_id= %s"
        self._execute_sql(sql, (after, id))

    def handle_restart(self, hostname):
        sql = "UPDATE tests SET started = null, status = 'PENDING', hostname=null  WHERE status = 'RUNNING' and hostname=%s"
        self._execute_sql(sql, (hostname,))
