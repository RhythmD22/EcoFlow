let _navigateTo = null;

function setNavigator(fn) {
  _navigateTo = fn;
}

function navigateTo(route) {
  if (_navigateTo) _navigateTo(route);
}

export { setNavigator, navigateTo };
