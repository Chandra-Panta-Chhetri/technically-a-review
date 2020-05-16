function requestNotificationPermission() {
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        pusherInit();
      }
    });
  }
}

function pusherInit() {
  const pusher = new Pusher("c627e88e08f0797f495c", {
    cluster: "us2"
  });
  const channel = pusher.subscribe("notifications");
  channel.bind("changed_post_or_comment", function (response) {
    var notification = new Notification(response.message);
    if (response.url) {
      notification.onclick = function (event) {
        window.location.href = response.url;
        event.preventDefault();
        notification.close();
      };
    }
  });
}

requestNotificationPermission();
