// =====================================================
// School Bus Route Management System - script.js
// Works with the ids in index.html. Data is saved in the
// browser using localStorage, so it stays after a refresh.
// =====================================================

// ---------- 1. Small helper functions ----------
function $(id) {
  return document.getElementById(id);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- 2. Load and save data ----------
var data = { buses: [], drivers: [], routes: [], students: [] };

try {
  var saved = JSON.parse(localStorage.getItem("sbrmData"));
  if (saved) data = saved;
} catch (e) {
  // if storage is blocked, we just start with empty data
}

function save() {
  try {
    localStorage.setItem("sbrmData", JSON.stringify(data));
  } catch (e) {}
}

// ---------- 3. Login and logout ----------
var ADMIN_USER = "admin";
var ADMIN_PASS = "admin123";

function showApp(loggedIn) {
  $("loginScreen").classList.toggle("hidden", loggedIn);
  document.querySelector("header").classList.toggle("hidden", !loggedIn);
  document.querySelector("main").classList.toggle("hidden", !loggedIn);
}

$("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var user = $("loginUser").value.trim();
  var pass = $("loginPass").value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem("sbrmLoggedIn", "yes");
    $("loginerr").textContent = "";
    $("loginForm").reset();
    showApp(true);
  } else {
    $("loginerr").textContent = "Wrong username or password. Try again.";
  }
});

$("logoutBtn").addEventListener("click", function () {
  sessionStorage.removeItem("sbrmLoggedIn");
  showApp(false);
});

// ---------- 4. Look up names from ids ----------
function findById(list, id) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

function busLabel(id) {
  var b = findById(data.buses, id);
  return b ? b.number : "-";
}

function driverLabel(id) {
  var d = findById(data.drivers, id);
  return d ? d.name : "-";
}

function routeLabel(id) {
  var r = findById(data.routes, id);
  return r ? r.name : "-";
}

// ---------- 5. Draw a table (with search and delete button) ----------
// rows = list of { id: "...", cells: ["text", "text"] }
function drawTable(tbodyId, rows, searchId, columns, onDelete) {
  var tbody = $(tbodyId);
  var query = $(searchId).value.trim().toLowerCase();
  tbody.innerHTML = "";

  var shown = rows.filter(function (r) {
    return r.cells.join(" ").toLowerCase().indexOf(query) !== -1;
  });

  if (shown.length === 0) {
    var emptyRow = tbody.insertRow();
    var emptyCell = emptyRow.insertCell();
    emptyCell.colSpan = columns;
    emptyCell.textContent = rows.length === 0 ? "No records yet." : "No matching records.";
    return;
  }

  shown.forEach(function (r) {
    var tr = tbody.insertRow();
    r.cells.forEach(function (text) {
      tr.insertCell().textContent = text;
    });
    var actionCell = tr.insertCell();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Delete";
    btn.addEventListener("click", function () {
      onDelete(r.id);
    });
    actionCell.appendChild(btn);
  });
}

// ---------- 6. Fill the dropdown boxes ----------
function fillSelect(selectId, list, labelFn, placeholder) {
  var select = $(selectId);
  var current = select.value;
  select.innerHTML = "";

  var first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);

  list.forEach(function (item) {
    var opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = labelFn(item);
    select.appendChild(opt);
  });

  // keep the old choice if it still exists
  if (findById(list, current)) select.value = current;
}

// ---------- 7. Show everything on the page ----------
function renderBuses() {
  var rows = data.buses.map(function (b) {
    return { id: b.id, cells: [b.number, b.capacity] };
  });
  drawTable("busTable", rows, "busSearch", 3, deleteBus);
}

function renderDrivers() {
  var rows = data.drivers.map(function (d) {
    return { id: d.id, cells: [d.name, d.phone] };
  });
  drawTable("driverTable", rows, "drvSearch", 3, deleteDriver);
}

function renderRoutes() {
  var rows = data.routes.map(function (r) {
    return {
      id: r.id,
      cells: [r.name, busLabel(r.busId), driverLabel(r.driverId), r.time, r.stops]
    };
  });
  drawTable("routeTable", rows, "rtSearch", 6, deleteRoute);
}

function renderStudents() {
  var rows = data.students.map(function (s) {
    return { id: s.id, cells: [s.name, s.cls, routeLabel(s.routeId)] };
  });
  drawTable("studentTable", rows, "stSearch", 4, deleteStudent);
}

function renderDropdowns() {
  fillSelect("rtBus", data.buses, function (b) { return b.number + " (" + b.capacity + " seats)"; }, "Select bus");
  fillSelect("rtDriver", data.drivers, function (d) { return d.name; }, "Select driver");
  fillSelect("stRoute", data.routes, function (r) { return r.name; }, "Select route");
}

function renderDashboard() {
  $("cBuses").textContent = data.buses.length;
  $("cDrivers").textContent = data.drivers.length;
  $("cRoutes").textContent = data.routes.length;
  $("cStudents").textContent = data.students.length;
}

function renderAll() {
  renderBuses();
  renderDrivers();
  renderRoutes();
  renderStudents();
  renderDropdowns();
  renderDashboard();
}

// ---------- 8. Add a bus ----------
$("busForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var number = $("busNo").value.trim();
  var capacity = parseInt($("busCap").value, 10);

  if (!number || isNaN(capacity) || capacity < 1) {
    alert("Enter a bus number and a capacity of at least 1.");
    return;
  }
  var duplicate = data.buses.some(function (b) {
    return b.number.toLowerCase() === number.toLowerCase();
  });
  if (duplicate) {
    alert("This bus number already exists.");
    return;
  }

  data.buses.push({ id: uid(), number: number, capacity: capacity });
  save();
  $("busForm").reset();
  renderAll();
});

// ---------- 9. Add a driver ----------
$("driverForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = $("drvName").value.trim();
  var phone = $("drvPhone").value.trim();

  if (!name || !/^[0-9]{10}$/.test(phone)) {
    alert("Enter the driver name and a 10-digit phone number.");
    return;
  }

  data.drivers.push({ id: uid(), name: name, phone: phone });
  save();
  $("driverForm").reset();
  renderAll();
});

// ---------- 10. Add a route ----------
$("routeForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = $("rtName").value.trim();
  var busId = $("rtBus").value;
  var driverId = $("rtDriver").value;
  var time = $("rtTime").value;
  var stops = $("rtStops").value.trim();

  if (!name || !busId || !driverId || !time || !stops) {
    alert("Fill in all route details, including bus and driver.");
    return;
  }

  data.routes.push({ id: uid(), name: name, busId: busId, driverId: driverId, time: time, stops: stops });
  save();
  $("routeForm").reset();
  renderAll();
});

// ---------- 11. Assign a student (with capacity check) ----------
function studentsOnRoute(routeId) {
  return data.students.filter(function (s) {
    return s.routeId === routeId;
  }).length;
}

$("studentForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = $("stName").value.trim();
  var cls = $("stClass").value.trim();
  var routeId = $("stRoute").value;

  if (!name || !cls || !routeId) {
    alert("Enter the student name, class and choose a route.");
    return;
  }

  var route = findById(data.routes, routeId);
  var bus = findById(data.buses, route.busId);
  if (bus && studentsOnRoute(routeId) >= bus.capacity) {
    alert("Bus " + bus.number + " is full (" + bus.capacity + " seats). Choose another route.");
    return;
  }

  data.students.push({ id: uid(), name: name, cls: cls, routeId: routeId });
  save();
  $("studentForm").reset();
  renderAll();
});

// ---------- 12. Delete (with safety checks) ----------
function deleteBus(id) {
  var used = data.routes.some(function (r) { return r.busId === id; });
  if (used) {
    alert("This bus is used in a route. Delete that route first.");
    return;
  }
  if (!confirm("Delete this bus?")) return;
  data.buses = data.buses.filter(function (b) { return b.id !== id; });
  save();
  renderAll();
}

function deleteDriver(id) {
  var used = data.routes.some(function (r) { return r.driverId === id; });
  if (used) {
    alert("This driver is used in a route. Delete that route first.");
    return;
  }
  if (!confirm("Delete this driver?")) return;
  data.drivers = data.drivers.filter(function (d) { return d.id !== id; });
  save();
  renderAll();
}

function deleteRoute(id) {
  if (studentsOnRoute(id) > 0) {
    alert("Students are assigned to this route. Delete them first.");
    return;
  }
  if (!confirm("Delete this route?")) return;
  data.routes = data.routes.filter(function (r) { return r.id !== id; });
  save();
  renderAll();
}

function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;
  data.students = data.students.filter(function (s) { return s.id !== id; });
  save();
  renderAll();
}

// ---------- 13. Search boxes: redraw tables while typing ----------
$("busSearch").addEventListener("input", renderBuses);
$("drvSearch").addEventListener("input", renderDrivers);
$("rtSearch").addEventListener("input", renderRoutes);
$("stSearch").addEventListener("input", renderStudents);

// ---------- 14. Start the page ----------
renderAll();
showApp(sessionStorage.getItem("sbrmLoggedIn") === "yes");
