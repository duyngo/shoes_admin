export default {
  apiUrl: "http://yoursite.com/api/",
};

const siteConfig = {
  siteName: "PULIRE",
  siteIcon: "ion-flash",
  footerText: "PULIRE ©2019",
};
const themeConfig = {
  topbar: "themedefault",
  sidebar: "themedefault",
  layout: "themedefault",
  theme: "themedefault",
};
const language = "english";

const jwtConfig = {
  fetchUrl: "/api/",
  secretKey: "secretKey",
};

const firebaseConfig = {
  apiKey: "AIzaSyCdpvUgaSmIUmvxIOtOMuubZmVoaEQhwa4",
  authDomain: "pulire-1fa87.firebaseapp.com",
  databaseURL: "https://pulire-1fa87.firebaseio.com",
  projectId: "pulire-1fa87",
  storageBucket: "pulire-1fa87.appspot.com",
  messagingSenderId: "61473071905",
  appId: "1:61473071905:web:cad53e6fae8d2511",
};

export { siteConfig, language, themeConfig, jwtConfig, firebaseConfig };
