import React from "react";
import './Navbar.css';
import footer_logo from '../../assets/overlays_logo2.png'
//import navProfile from '../../assets/nav-profile.svg'

const Navbar = () => {
  return(
    <div className="navbar">
       <div className="footer-logo">
                <img src={footer_logo} alt="" />
                <p>Overlays</p>
            </div>
    

    </div>
  )
}

export default Navbar