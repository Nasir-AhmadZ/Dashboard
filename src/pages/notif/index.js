import { useState, useEffect } from 'react';
import classes from '../../styles/notif.module.css';

function NotifPage() {
  const [unreadnotif, setUnread] = useState([]);
  const [readnotif, setRead] = useState([]);

  useEffect(() => {
    fetchRead();
    fetchUnread();
  }, []);

  const fetchUnread = async () => {
    try {
      const response = await fetch('http://ae8bce2c7f4ea4b02b8364d4a9931506-593631115.eu-west-1.elb.amazonaws.com:8003/notifications/unread');
      const data = await response.json();
      setUnread(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchRead = async () => {
    try {
      const response = await fetch('http://ae8bce2c7f4ea4b02b8364d4a9931506-593631115.eu-west-1.elb.amazonaws.com:8003/notifications/read');
      const data = await response.json();
      setRead(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const readNotif = async (entryId) => {
    try {
      const response = await fetch(`http://ae8bce2c7f4ea4b02b8364d4a9931506-593631115.eu-west-1.elb.amazonaws.com:8003/notifications/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opened: true
        })
      });
      
      if (response.ok) {
        fetchUnread();
        fetchRead();
      }
    } catch (error) {
      console.error('Error reading notification:', error);
    }
  };

  const deleteNotif = async (entryId) => {
    try {
      const response = await fetch(`http://ae8bce2c7f4ea4b02b8364d4a9931506-593631115.eu-west-1.elb.amazonaws.com:8003/notifications/${entryId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchRead();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const deleteAllNotif = async () => {
    if (!confirm('Delete ALL notifications?')) return;

    try {
      const response = await fetch('http://ae8bce2c7f4ea4b02b8364d4a9931506-593631115.eu-west-1.elb.amazonaws.com:8003/notifications', {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchUnread();
        fetchRead();
      }
    } catch (error) {
      console.error('Error deleting all projects:', error);
    }
  };

  return (
      <div className={classes.container}>
        <h1>Notifications</h1>

          <h2>Unread Notifications</h2>
          <div className={classes.ntfs}>
            {unreadnotif.map(notif => (
              <div key={notif.id} className={classes.ntf}>
                <div>
                  <strong>{notif.message}</strong>
                  <p>{new Date(notif.timestamp).toLocaleString()}</p>
                  <button onClick={() => readNotif(notif.id)} className={classes.readBtn}>
                    Read
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2>Read Notifications</h2>
          <div className={classes.ntfs}>
            {readnotif.map(notif => (
              <div key={notif.id} className={classes.ntf}>
                <div>
                  <strong>{notif.message}</strong>
                  <p>{new Date(notif.timestamp).toLocaleString()}</p>
                  <button onClick={() => deleteNotif(notif.id)} className={classes.deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={deleteAllNotif} className={classes.deleteBtn}>
            Delete All Notifications
          </button>
      </div>
  );
}

export default NotifPage;