import React from "react";
import {
    NavLink,
  } from "react-router-dom";
import GithubIcon from "mdi-react/GithubIcon";

export function StatusColor(status) {
    switch (status) {
    case "FAILED" || "BUILD FAILED":   return "red";
    case "PASSED":   return "green";
    case "RUNNING":   return "blue";
    case "OTHER":   return "grey";
    default:      return "black";
    }
}


export function HistorySwitchText(status, count) {
    switch (status) {
        case "FAILED" :   return "F:"+count;
        case "PASSED":   return "P:"+count;
        case "OTHER":   return "O:"+count;
        default:      return "";
        }
}

export function RenderHistory(a_run, title) {
    return (
        <NavLink to={"/test_history/" + a_run.test_id}>{title}<table style={{"border": "0px"}}><tbody><tr>
            {Object.entries(a_run.history).map( ([key, value]) =>
                <td style={{"border": "0px",
                            "padding": "0px",
                            "fontSize": "10px",
                            "color": StatusColor(key)}}>
                    {HistorySwitchText(key, value)}</td>
            )}
            </tr></tbody></table></NavLink>
        )
}

export function fetchAPI(path, post=false) {
    const url = process.env.REACT_APP_SERVER_IP + '/api' + path;
    const opts = {
        headers: { 'Accept': 'application/json' },
        method: post ? 'POST' : 'GET',
    };
    return fetch(url, opts)
        .then(response => response.json())
        .catch(err => console.log('Fetch Error :-S', err));
}

export function GitRepo() {
    return process.env.REACT_APP_GIT_REPO
}

export function LoginPage(client_id, redirect_uri, data, setData) {
    console.log(redirect_uri);
    return (
    <section className="section-login">
        <div className="div-login">
          <img style={{"width": "100%"}} alt="" src="duck.jpg"/>
          <span>{data.errorMessage}</span>
          <div className="github-login">
             {data.isLoading ? (
              <div className="loader-container">
                <div className="loader"></div>
              </div>
            ) : (
                <a
                  className="login-link"
                  href={`https://github.com/login/oauth/authorize?scope=read:org&client_id=${client_id}&redirect_uri=${redirect_uri}`}
                  onClick={() => {
                    setData({ ...data, errorMessage: "" });
                  }}
                >
                  <GithubIcon />
                  <span>Login with GitHub</span>
                </a>
            )}
          </div>
        </div>
      </section>
  );
}
