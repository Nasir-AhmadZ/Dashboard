import MainNavigation from './MainNavigation';
import classes from './Layout.module.css';
import Popup from "./Popup"

function Layout(props) {
  let popupHide
  return (
    <div>
      <Popup hide={popupHide}/>
      <MainNavigation />
      <main className={classes.main}>{props.children}</main>
    </div>
  );
}

export default Layout;
