import React, { useContext } from 'react';
import Cookies from 'universal-cookie';

import * as App from './App';


const cookies = new Cookies();
const COOKIE_NAME = 'nay-code';


export function getLoginState() {
    const code = cookies.get(COOKIE_NAME, {doNotParse: true});
    if (code) {
        const match = code.match(/^(_?)([a-zA-Z0-9]+):[-_a-zA-Z0-9=]+$/);
        if (match) {
            return {
                username: match[2],
                isAuthorised: !match[1],
            };
        }
        console.log('Invalid code: ' + code);
    }
    return {};
}


export function LoginBar(props) {
    const [authState, setAuthState] = useContext(App.AuthContext);

    const logout = () => {
        cookies.remove(COOKIE_NAME);
        setAuthState({});
        return false;
    };

    const userInfo = () => {
        if (!authState.username) {
            return <a href={common.apiBaseHref() + '/login/web'}>Log In</a>;
        }
        const avatarLink =
              `https://github.com/${authState.username}.png?size=64`;
        const nearIcon = authState.isAuthorised
              ? <svg viewBox="70 70 148 148"><use href="#near-icon"/></svg>
              : null;
        return <>
          <img src={avatarLink} width="16" height="16" alt="" />
          {nearIcon}
          <span>{authState.username}</span>
          <button onClick={logout}>Log Out</button>
        </>;
    }

    return <nav id="userinfo"><h1><svg viewBox="0 0 96 96"><use href="#duck"/></svg>NayDuck</h1><div>{userInfo()}</div></nav>;
}
