import MainNavigation from './MainNavigation';
import GlobalAlertBanner from '../generic/GlobalAlertBanner';
import classes from './Layout.module.css';

function Layout(props) {
  return (
    <div>
      <MainNavigation />
      <GlobalAlertBanner />
      <main className={classes.main}>{props.children}</main>
    </div>
  );
}

export default Layout;
