(function (w) {
  var KEY_WORK = "vaktmester-larsen-data-v1";
  var KEY_REQ = "vaktmester-larsen-requests-v1";
  var KEY_LAGER = "vaktmester-larsen-lager-v1";

  function cfg() {
    return w.VL_CONFIG || { phone: "+4790906500", email: "", endpoint: "" };
  }

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function loadWork() {
    var data = loadJson(KEY_WORK, { jobs: [], customers: [] });
    if (!Array.isArray(data.jobs)) data.jobs = [];
    if (!Array.isArray(data.customers)) data.customers = [];
    return data;
  }

  function saveWork(data) {
    saveJson(KEY_WORK, { jobs: data.jobs || [], customers: data.customers || [] });
  }

  function loadRequests() {
    var data = loadJson(KEY_REQ, { requests: [] });
    return Array.isArray(data.requests) ? data.requests : (Array.isArray(data) ? data : []);
  }

  function saveRequests(list) {
    saveJson(KEY_REQ, { requests: list });
  }

  function loadLager() {
    var data = loadJson(KEY_LAGER, { items: [] });
    return Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
  }

  function saveLager(items) {
    saveJson(KEY_LAGER, { items: items });
  }

  function formatRequest(req) {
    return [
      "Anbud / prisforespørsel til Vaktmester Larsen",
      "",
      "Navn: " + (req.name || ""),
      "Telefon: " + (req.phone || ""),
      "E-post: " + (req.email || "(ikke oppgitt)"),
      "Sted: " + (req.address || "(ikke oppgitt)"),
      "Type: " + (req.type || ""),
      "Ønsket dato: " + (req.date || "(ikke oppgitt)"),
      "Tidspunkt: " + (req.timeNote || "(ikke oppgitt)"),
      "Bilder: " + (req.photoNote || "nei"),
      "",
      req.description || ""
    ].join("\n");
  }

  function smsHref(body) {
    var phone = cfg().phone || "+4790906500";
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return "sms:" + phone + (ios ? "&" : "?") + "body=" + encodeURIComponent(body);
  }

  function postEndpoint(payload) {
    var url = cfg().endpoint;
    if (!url) return Promise.resolve({ skipped: true });
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("Innsending til server feilet (" + res.status + ").");
      return { ok: true };
    });
  }

  function saveRequest(req) {
    var list = loadRequests();
    if (!req.id) req.id = uid();
    if (!req.createdAt) req.createdAt = new Date().toISOString();
    if (!req.status) req.status = "ny";
    list.unshift(req);
    saveRequests(list);
    return req;
  }

  function csvEscape(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function parseCsv(text) {
    text = String(text || "").replace(/^\uFEFF/, "");
    var rows = [];
    var row = [];
    var cell = "";
    var q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else q = false;
        } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ";" || ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch !== "\r") cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  w.VL = {
    uid: uid,
    cfg: cfg,
    loadWork: loadWork,
    saveWork: saveWork,
    loadRequests: loadRequests,
    saveRequests: saveRequests,
    saveRequest: saveRequest,
    loadLager: loadLager,
    saveLager: saveLager,
    formatRequest: formatRequest,
    smsHref: smsHref,
    postEndpoint: postEndpoint,
    csvEscape: csvEscape,
    download: download,
    parseCsv: parseCsv,
    KEY_WORK: KEY_WORK,
    KEY_REQ: KEY_REQ,
    KEY_LAGER: KEY_LAGER
  };
})(window);
