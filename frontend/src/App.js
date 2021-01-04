import logo from './logo.svg';
import './App.css';
import React from 'react';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import axios from 'axios';

function App() {

  //Google Login
  const responseSuccessGoogle = (response) => {
    console.log(response);
    axios({
      method: "POST",
      url: "http://localhost:8000/api/googlelogin", //change it for real url
      data: {tokenId: response.tokenId}
    }).then(response => {
        console.log("Google Login Success", response);
    })
  }

  const responseErrorGoogle = (response) => {

  }
  //Ends Google Login

  //Facebook Login
  const responseFacebook = (response) => {
    console.log(response);
    axios({
      method: "POST",
      url: "http://localhost:8000/api/facebooklogin", //change it for real url
      data: {accesToken: response.accessToken, userID: response.userID}
    }).then(response => {
        console.log("Facebook Login Success, Client Side", response);
    })
  }
  //Ends Facebook Login

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>

        <br></br>

      <GoogleLogin
        clientId="169423175057-s09kigjiinijg7d2suvi7e8r9f1s9n1l.apps.googleusercontent.com" //need to create it in https://console.cloud.google.com/
        buttonText="Login with Google"
        onSuccess={responseSuccessGoogle}
        onFailure={responseErrorGoogle}
        cookiePolicy={'single_host_origin'} />

      <br></br>

      <FacebookLogin
        appId="2898556460431304" //need to create an app in https://developers.facebook.com/ to get appID
        autoLoad={false}
        callback={responseFacebook} />

      </header>

    </div>
  );
}

export default App;
