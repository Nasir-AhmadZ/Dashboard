import classes from './MainNavigation.module.css'
import Link from 'next/link'
import HamMenu from "../generic/HamMenu"
import Button from "../generic/Button"
import { GiShoppingCart } from 'react-icons/gi'
import { useState } from 'react'

function MainNavigation() {
  let [popupToggle, setPopupToggle] = useState(false)
  let [noOfOrders, setNoOfOrders] = useState(0)

  function checkoutCallback() {
    setNoOfOrders(noOfOrders + 1)
    console.log("noOfOrders: " + noOfOrders)
  }
  console.log("MainNavigation code called")

  function toggleMenuHide() {
    if (popupToggle == true) {
      setPopupToggle(false)
    } else {
      setPopupToggle(true)
    }
  }

  function incOrders() {
    noOfOrders++;
    if(noOfOrders%5 == 0){
      setNoOfOrders(noOfOrders);
    }
    if(noOfOrders == 20){
      // Stop the interval timer
    }
  }

  // Write code to call incOrders() every second, and if noOfOrders is evenly divisible by 5, then update the state of this component.
//setInterval(incOrders, 1000);

  return (
    <header className={classes.header}>
      {popupToggle && <Button text1="Probably" text2="the best way" maxWidth="100px" onClickHandler={() => toggleMenuHide()} />}
      <HamMenu toggleMenuHide={() => toggleMenuHide()} />
      <div className={classes.logo}>React Meetups</div>
      <nav>
        <ul>
          <li>
            <Link href='/'>All Meetups</Link>
          </li>
          <li>
            <Link href='/new-meetup'>Add New Meetup</Link>
          </li>
        </ul>
      </nav>
      <Button text1="Checkout" maxWidth="100px" onClickHandler={() => checkoutCallback()} icon={<GiShoppingCart />} />
      <Button text1={"Orders: "+noOfOrders} maxWidth="100px" onClickHandler={() => ordersCallback(noOfOrders)} />
    </header>
  );
}

export default MainNavigation
