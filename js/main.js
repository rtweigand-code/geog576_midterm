// agrow midterm - main.js
// main idea: map + 2 hosted layers + filtering
// and for creating features, use my own buttons (Editor widget was buggy w/ polygons)

require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",

  "esri/layers/FeatureLayer",
  "esri/Basemap",

  "esri/widgets/Search",
  "esri/widgets/Locate",
  "esri/widgets/Zoom",

  "esri/widgets/BasemapGallery",
  "esri/widgets/LayerList",
  "esri/widgets/Editor",
  "esri/widgets/Expand",

  "esri/widgets/Sketch/SketchViewModel",
  "esri/Graphic",

  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/SimpleRenderer"
], function (
  esriConfig,
  Map,
  MapView,

  FeatureLayer,
  Basemap,

  Search,
  Locate,
  Zoom,

  BasemapGallery,
  LayerList,
  Editor,
  Expand,

  SketchViewModel,
  Graphic,

  SimpleMarkerSymbol,
  SimpleRenderer
) {

  // API key (same as lab setup)
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // hosted layer urls
  var usersLandUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Users_Land/FeatureServer/0";

  var fieldDataUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/field_data/FeatureServer/0";

  // start map on imagery
  var map = new Map({
    basemap: "arcgis-imagery"
  });

  // polygon layer (land)
  var usersLandLayer = new FeatureLayer({
    url: usersLandUrl,
    title: "My Land",
    outFields: ["*"],
    popupTemplate: {
      title: "{land_name}",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "land_owner", label: "Owner" },
          { fieldName: "crop_type", label: "Crop Type" },
          { fieldName: "acres", label: "Acres" }
        ]
      }]
    }
  });

  // point layer (field data)
  // make them stand out on imagery
  var pointSym = new SimpleMarkerSymbol({
    style: "circle",
    size: 10,
    color: [0, 170, 255, 1],
    outline: { color: [255, 255, 255, 1], width: 1.5 }
  });

  var fieldDataLayer = new FeatureLayer({
    url: fieldDataUrl,
    title: "Field Data",
    outFields: ["*"],
    renderer: new SimpleRenderer({ symbol: pointSym }),
    popupTemplate: {
      title: "{title}",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "obs_type", label: "Observation Type" },
          { fieldName: "status", label: "Status" },
          { fieldName: "severity", label: "Severity (1–5)" },
          { fieldName: "crop_type", label: "Crop Type" },
          { fieldName: "obs_notes", label: "Notes" }
        ]
      }]
    }
  });

  map.addMany([usersLandLayer, fieldDataLayer]);

  // view (Madison-ish default)
  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4, 43.07],
    zoom: 10
  });

  // -------------------------
  // widgets layout
  // -------------------------
  // top-right: search, then locate + zoom under it
  var searchWidget = new Search({ view: view });
  var locateWidget = new Locate({ view: view });
  var zoomWidget = new Zoom({ view: view });

  view.ui.add(searchWidget, "top-right");
  view.ui.add(locateWidget, { position: "top-right", index: 1 });
  view.ui.add(zoomWidget, { position: "top-right", index: 2 });

  // top-left: basemap, layers, editor (that order)
  var basemapGallery = new BasemapGallery({ view: view });
  var layerList = new LayerList({ view: view });

  var basemapExpand = new Expand({
    view: view,
    content: basemapGallery,
    expanded: false,
    expandTooltip: "Basemaps",
    collapseTooltip: "Basemaps"
  });

  var layersExpand = new Expand({
    view: view,
    content: layerList,
    expanded: false,
    expandTooltip: "Layers",
    collapseTooltip: "Layers"
  });

  view.ui.add(basemapExpand, "top-left");
  view.ui.add(layersExpand, "top-left");

  // keep basemaps simple (imagery + topo)
  view.when(function () {
    Promise.all([
      Basemap.fromId("arcgis-imagery"),
      Basemap.fromId("arcgis-topographic")
    ]).then(function (basemaps) {
      basemapGallery.source = basemaps;
    });
  });

  // Editor stays for updating existing features (creating is handled by my buttons)
  view.when(function () {
    var editor = new Editor({
      view: view,
      allowedWorkflows: ["update"],
      layerInfos: [
        { layer: usersLandLayer },
        { layer: fieldDataLayer }
      ]
    });

    var editorExpand = new Expand({
      view: view,
      content: editor,
      expanded: false,
      expandTooltip: "Editor",
      collapseTooltip: "Editor"
    });

    view.ui.add(editorExpand, "top-left");
  });

  // -------------------------
  // sidebar filters
  // -------------------------
  var obsFilter = document.getElementById("obsFilter");
  var statusFilter = document.getElementById("statusFilter");
  var severityFilter = document.getElementById("severityFilter");
  var cropFilter = document.getElementById("cropFilter");
  var searchBtn = document.getElementById("searchBtn");
  var clearBtn = document.getElementById("clearFilters");

  // match my AGOL domains
  var obsTypes = [
    "Vegetation Health",
    "Nutrients",
    "Disease",
    "Pest",
    "Soil Quality",
    "Irrigation",
    "Erosion",
    "Infrastructure",
    "Livestock",
    "General",
    "Other"
  ];

  var statuses = ["Open", "In Progress", "Monitoring", "Closed"];

  var severityOptions = [
    { label: "Minimal", code: 1 },
    { label: "Low", code: 2 },
    { label: "Moderate", code: 3 },
    { label: "High", code: 4 },
    { label: "Critical", code: 5 }
  ];

  var cropTypes = [
    "Corn",
    "Soybean",
    "Wheat",
    "Potatoes",
    "Alfalfa",
    "Specialty Crop",
    "Cover Crop",
    "Pasture",
    "Other"
  ];

  function addOptions(selectEl, values) {
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  function addSeverityOptions(selectEl, values) {
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = String(v.code);   // stored value in AGOL
      opt.textContent = v.label;    // what user sees
      selectEl.appendChild(opt);
    });
  }

  addOptions(obsFilter, obsTypes);
  addOptions(statusFilter, statuses);
  addSeverityOptions(severityFilter, severityOptions);
  addOptions(cropFilter, cropTypes);

  function safeText(txt) {
    return txt.replace("'", "''");
  }

  function applyFilters() {
    var parts = [];

    if (obsFilter.value) parts.push("obs_type = '" + safeText(obsFilter.value) + "'");
    if (statusFilter.value) parts.push("status = '" + safeText(statusFilter.value) + "'");
    if (severityFilter.value) parts.push("severity = " + severityFilter.value);
    if (cropFilter.value) parts.push("crop_type = '" + safeText(cropFilter.value) + "'");

    fieldDataLayer.definitionExpression = parts.length ? parts.join(" AND ") : "1=1";
  }

  // search button just applies the filters
  searchBtn.addEventListener("click", applyFilters);

  // clear resets everything
  clearBtn.addEventListener("click", function () {
    obsFilter.value = "";
    statusFilter.value = "";
    severityFilter.value = "";
    cropFilter.value = "";
    fieldDataLayer.definitionExpression = "1=1";
  });

  // -------------------------
  // custom add buttons (this is what fixes polygon creation)
  // -------------------------
  var addPointBtn = document.getElementById("addPointBtn");
  var addLandBtn = document.getElementById("addLandBtn");

  var sketchVM = new SketchViewModel({
    view: view
  });

  // overlay form stuff
  var overlay = document.getElementById("formOverlay");
  var formTitle = document.getElementById("formTitle");
  var formBody = document.getElementById("formBody");
  var formSave = document.getElementById("formSave");
  var formCancel = document.getElementById("formCancel");

  var currentMode = null;      // "point" or "land"
  var pendingGeometry = null;  // geometry waiting to be saved

  function openForm(mode, geom) {
    currentMode = mode;
    pendingGeometry = geom;

    formBody.innerHTML = "";

    if (mode === "point") {
      formTitle.textContent = "Add Field Data";
      formBody.appendChild(makeInput("Title", "fd_title"));
      formBody.appendChild(makeSelect("Observation Type", "fd_obs", obsTypes));
      formBody.appendChild(makeSelect("Status", "fd_status", statuses));
      formBody.appendChild(makeSelect("Severity", "fd_sev", severityOptions.map(function (s) { return s.label; })));
      formBody.appendChild(makeSelect("Crop Type", "fd_crop", cropTypes));
      formBody.appendChild(makeTextarea("Notes", "fd_notes"));
    }

    if (mode === "land") {
      formTitle.textContent = "Add Land";
      formBody.appendChild(makeInput("Land Name", "land_name"));
      formBody.appendChild(makeInput("Owner", "land_owner"));
      formBody.appendChild(makeSelect("Crop Type", "land_crop", cropTypes));
      formBody.appendChild(makeInput("Acres", "land_acres", "number"));
    }

    overlay.style.display = "flex";
  }

  function closeForm() {
    overlay.style.display = "none";
    currentMode = null;
    pendingGeometry = null;
  }

  function makeInput(label, id, type) {
    var wrap = document.createElement("div");
    wrap.className = "formRow";

    var l = document.createElement("label");
    l.textContent = label;

    var i = document.createElement("input");
    i.id = id;
    i.type = type || "text";

    wrap.appendChild(l);
    wrap.appendChild(i);
    return wrap;
  }

  function makeTextarea(label, id) {
    var wrap = document.createElement("div");
    wrap.className = "formRow";

    var l = document.createElement("label");
    l.textContent = label;

    var t = document.createElement("textarea");
    t.id = id;
    t.rows = 3;

    wrap.appendChild(l);
    wrap.appendChild(t);
    return wrap;
  }

  function makeSelect(label, id, values) {
    var wrap = document.createElement("div");
    wrap.className = "formRow";

    var l = document.createElement("label");
    l.textContent = label;

    var s = document.createElement("select");
    s.id = id;

    var starter = document.createElement("option");
    starter.value = "";
    starter.textContent = "Select...";
    s.appendChild(starter);

    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      s.appendChild(opt);
    });

    wrap.appendChild(l);
    wrap.appendChild(s);
    return wrap;
  }

  // cancel just closes overlay
  formCancel.addEventListener("click", function () {
    closeForm();
  });

  // save button -> add feature to the right layer
  formSave.addEventListener("click", function () {
    if (!currentMode || !pendingGeometry) return;

    if (currentMode === "point") {
      var title = document.getElementById("fd_title").value || "Field Observation";
      var obs = document.getElementById("fd_obs").value || "";
      var status = document.getElementById("fd_status").value || "";
      var sevLabel = document.getElementById("fd_sev").value || "";
      var crop = document.getElementById("fd_crop").value || "";
      var notes = document.getElementById("fd_notes").value || "";

      // map the severity label back to 1-5
      var sevNum = null;
      severityOptions.forEach(function (s) {
        if (s.label === sevLabel) sevNum = s.code;
      });

      var g = new Graphic({
        geometry: pendingGeometry,
        attributes: {
          title: title,
          obs_type: obs,
          status: status,
          severity: sevNum,
          crop_type: crop,
          obs_notes: notes
        }
      });

      fieldDataLayer.applyEdits({ addFeatures: [g] })
        .then(function () {
          closeForm();
        })
        .catch(function (err) {
          console.log("point save error:", err);
          alert("Point didn't save. Might be layer permissions.");
        });
    }

    if (currentMode === "land") {
      var landName = document.getElementById("land_name").value || "My Land";
      var owner = document.getElementById("land_owner").value || "";
      var crop2 = document.getElementById("land_crop").value || "";
      var acresStr = document.getElementById("land_acres").value || "";
      var acresNum = acresStr ? Number(acresStr) : null;

      var g2 = new Graphic({
        geometry: pendingGeometry,
        attributes: {
          land_name: landName,
          land_owner: owner,
          crop_type: crop2,
          acres: acresNum
        }
      });

      usersLandLayer.applyEdits({ addFeatures: [g2] })
        .then(function () {
          closeForm();
        })
        .catch(function (err) {
          console.log("polygon save error:", err);
          alert("Polygon didn't save. Might be layer permissions.");
        });
    }
  });

  // start point draw
  addPointBtn.addEventListener("click", function () {
    sketchVM.cancel();
    view.popup.close();
    sketchVM.create("point");
  });

  // start polygon draw
  addLandBtn.addEventListener("click", function () {
    sketchVM.cancel();
    view.popup.close();
    sketchVM.create("polygon");
  });

  // when sketch finishes, open the form
  sketchVM.on("create", function (evt) {
    if (evt.state !== "complete") return;

    var geom = evt.graphic.geometry;

    if (geom.type === "point") openForm("point", geom);
    if (geom.type === "polygon") openForm("land", geom);
  });

});