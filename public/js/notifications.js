var hasNotificationPermission = false;

function requestNotificationPermission() {
  if (Notification.permission === "granted") {
    hasNotificationPermission = true;
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        hasNotificationPermission = true;
      }
    });
  }
}
requestNotificationPermission();

var pusher = new Pusher("c627e88e08f0797f495c", {
  cluster: "us2"
});

if (hasNotificationPermission) {
  var channel = pusher.subscribe("notifications");
  channel.bind("changed_post_or_comment", function (data) {
    var notification = new Notification(data.message);
    if (data.url) {
      notification.onclick = function (event) {
        window.location.href = data.url;
        event.preventDefault();
        notification.close();
      };
    }
  });
}
