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
  const pusher = new Pusher("49ce1b345dea889b9c97", {
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
