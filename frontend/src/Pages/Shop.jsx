import React from "react";
import Hero from "../Components/Hero/Hero";

import Offers from "../Components/Offers/offers";
import NewCollections from "../Components/NewCollections/NewCollections";
import NewsLetter from "../Components/NewsLetter/NewsLetter";



const Shop = () =>{
    return(
        <div>
        <Hero/> 
        <Offers/>
        <NewCollections/>
        <NewsLetter/>
        </div>
    )
}
export default Shop