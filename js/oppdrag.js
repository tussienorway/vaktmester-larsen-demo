(function () {
  var KEY = "vaktmester-larsen-data-v1";
  var STATUS = ["ny", "planlagt", "ferdig", "fakturert"];
  var STATUS_LABEL = { ny: "Ny", planlagt: "Planlagt", ferdig: "Ferdig", fakturert: "Fakturert" };
  var filter = "alle";
  var statusEl = document.getElementById("verktoy-status");

  function load() {
    if (window.VL && window.VL.loadWork) return window.VL.loadWork();
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return { jobs: [], customers: [] };
      var data = JSON.parse(raw);
      return {
        jobs: Array.isArray(data.jobs) ? data.jobs : [],
        customers: Array.isArray(data.customers) ? data.customers : []
      };
    } catch (e) {
      return { jobs: [], customers: [] };
    }
  }

  function save(data) {
    if (window.VL && window.VL.saveWork) window.VL.saveWork(data);
    else localStorage.setItem(KEY, JSON.stringify(data));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.classList.toggle("error", !!isError);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "Uten dato";
    var p = iso.split("-");
    if (p.length !== 3) return iso;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function telHref(phone) {
    var digits = String(phone || "").replace(/[^\d+]/g, "");
    return digits ? "tel:" + digits : "";
  }

  var data = load();

  /* Tabs */
  var tabOppdrag = document.getElementById("tab-oppdrag");
  var tabFast = document.getElementById("tab-fast");
  var tabInnboks = document.getElementById("tab-innboks");
  var panelOppdrag = document.getElementById("panel-oppdrag");
  var panelFast = document.getElementById("panel-fast");
  var panelInnboks = document.getElementById("panel-innboks");

  function showTab(name) {
    tabOppdrag.setAttribute("aria-selected", name === "oppdrag" ? "true" : "false");
    tabFast.setAttribute("aria-selected", name === "fast" ? "true" : "false");
    if (tabInnboks) tabInnboks.setAttribute("aria-selected", name === "innboks" ? "true" : "false");
    panelOppdrag.classList.toggle("hidden", name !== "oppdrag");
    panelFast.classList.toggle("hidden", name !== "fast");
    if (panelInnboks) panelInnboks.classList.toggle("hidden", name !== "innboks");
    if (name === "innboks" && location.hash !== "#innboks") {
      if (history.replaceState) history.replaceState(null, "", "#innboks");
    } else if (name !== "innboks" && location.hash === "#innboks") {
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    }
  }
  tabOppdrag.addEventListener("click", function () { showTab("oppdrag"); });
  tabFast.addEventListener("click", function () { showTab("fast"); });
  if (tabInnboks) tabInnboks.addEventListener("click", function () { showTab("innboks"); });

  /* Jobs */
  var jobForm = document.getElementById("jobb-skjema");
  var jobList = document.getElementById("jobb-liste");

  function jobFromForm() {
    var id = document.getElementById("jobb-id").value || uid();
    var prev = data.jobs.find(function (j) { return j.id === id; });
    return {
      id: id,
      customer: document.getElementById("kunde").value.trim(),
      phone: document.getElementById("jobb-telefon").value.trim(),
      address: document.getElementById("jobb-adresse").value.trim(),
      type: document.getElementById("jobb-type").value,
      date: document.getElementById("jobb-dato").value,
      status: document.getElementById("jobb-status").value,
      price: document.getElementById("jobb-pris").value.trim(),
      notes: document.getElementById("jobb-notat").value.trim(),
      materialsUsed: (prev && prev.materialsUsed) || [],
      requestId: prev && prev.requestId
    };
  }

  function resetJobForm() {
    jobForm.reset();
    document.getElementById("jobb-id").value = "";
    document.getElementById("jobb-lagre").textContent = "Lagre oppdrag";
    document.getElementById("jobb-avbryt").classList.add("hidden");
  }

  function fillJobForm(job) {
    document.getElementById("jobb-id").value = job.id;
    document.getElementById("kunde").value = job.customer || "";
    document.getElementById("jobb-telefon").value = job.phone || "";
    document.getElementById("jobb-adresse").value = job.address || "";
    document.getElementById("jobb-type").value = job.type || "Snømåking";
    document.getElementById("jobb-dato").value = job.date || "";
    document.getElementById("jobb-status").value = job.status || "ny";
    document.getElementById("jobb-pris").value = job.price || "";
    document.getElementById("jobb-notat").value = job.notes || "";
    document.getElementById("jobb-lagre").textContent = "Oppdater oppdrag";
    document.getElementById("jobb-avbryt").classList.remove("hidden");
    document.getElementById("kunde").focus();
    showTab("oppdrag");
  }

  jobForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var job = jobFromForm();
    if (!job.customer) return;
    var idx = data.jobs.findIndex(function (j) { return j.id === job.id; });
    if (idx >= 0) data.jobs[idx] = job;
    else data.jobs.unshift(job);
    save(data);
    resetJobForm();
    renderJobs();
    setStatus("Oppdraget er lagret i denne nettleseren.");
  });

  document.getElementById("jobb-avbryt").addEventListener("click", resetJobForm);

  document.getElementById("status-filter").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-filter]");
    if (!btn) return;
    filter = btn.getAttribute("data-filter");
    renderJobs();
  });

  function counts() {
    var c = { alle: data.jobs.length, ny: 0, planlagt: 0, ferdig: 0, fakturert: 0 };
    data.jobs.forEach(function (j) {
      if (c[j.status] != null) c[j.status] += 1;
    });
    return c;
  }

  function renderJobs() {
    var c = counts();
    STATUS.concat(["alle"]).forEach(function (s) {
      var el = document.getElementById("antall-" + s);
      if (el) el.textContent = c[s] ? "(" + c[s] + ")" : "";
    });
    document.querySelectorAll("#status-filter .chip").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-filter") === filter ? "true" : "false");
    });

    var items = data.jobs.filter(function (j) {
      return filter === "alle" || j.status === filter;
    });

    if (!items.length) {
      jobList.innerHTML = '<p class="empty">Ingen oppdrag i denne visningen ennå.</p>';
      return;
    }

    jobList.innerHTML = items.map(function (j) {
      var phone = j.phone
        ? (telHref(j.phone)
          ? '<a href="' + escapeHtml(telHref(j.phone)) + '">' + escapeHtml(j.phone) + "</a>"
          : escapeHtml(j.phone))
        : "";
      var meta = [escapeHtml(j.type), formatDate(j.date), phone, escapeHtml(j.address)]
        .filter(Boolean)
        .join(" · ");
      var price = j.price ? "<p class=\"meta\">Pris: " + escapeHtml(j.price) + "</p>" : "";
      var notes = j.notes ? "<p class=\"notes\">" + escapeHtml(j.notes) + "</p>" : "";
      var nextBtns = STATUS.filter(function (s) { return s !== j.status; }).map(function (s) {
        return '<button type="button" class="btn btn-ghost btn-small" data-act="status" data-id="' +
          escapeHtml(j.id) + '" data-status="' + s + '">Sett ' + STATUS_LABEL[s].toLowerCase() + "</button>";
      }).join("");
      return (
        '<article class="job">' +
          '<div class="job-top">' +
            "<div><h3>" + escapeHtml(j.customer) + "</h3><p class=\"meta\">" + meta + "</p>" + price + notes + "</div>" +
            '<span class="status status-' + escapeHtml(j.status) + '">' + escapeHtml(STATUS_LABEL[j.status] || j.status) + "</span>" +
          "</div>" +
          '<div class="job-actions">' +
            '<button type="button" class="btn btn-ghost btn-small" data-act="edit" data-id="' + escapeHtml(j.id) + '">Rediger</button>' +
            nextBtns +
            '<button type="button" class="btn btn-ghost btn-small" data-act="delete" data-id="' + escapeHtml(j.id) + '">Slett</button>' +
          "</div>" +
          materialBlock(j) +
        "</article>"
      );
    }).join("");
  }


  function materialBlock(job) {
    var used = job.materialsUsed || [];
    var list = used.length
      ? "<ul>" + used.map(function (m) {
          return "<li>" + escapeHtml(m.name) + ": " + escapeHtml(m.qty) + " " + escapeHtml(m.unit || "") + "</li>";
        }).join("") + "</ul>"
      : "<p class=\"note\" style=\"margin:0 0 0.4rem\">Ingen materialer knyttet til jobben ennå.</p>";
    var stock = (window.VL && window.VL.loadLager) ? window.VL.loadLager() : [];
    var picker;
    if (!stock.length) {
      picker = '<p class="note">Ingen varer i lageret. <a href="lager.html">Åpne lager</a></p>';
    } else {
      picker = '<div class="mat-row">' +
        '<select aria-label="Vare fra lager">' +
        stock.map(function (i) {
          return '<option value="' + escapeHtml(i.id) + '">' + escapeHtml(i.name) + " (" + escapeHtml(i.qty) + " " + escapeHtml(i.unit) + ")</option>";
        }).join("") +
        "</select>" +
        '<input type="number" step="0.01" min="0" value="1" aria-label="Antall" style="width:5.5rem">' +
        '<button type="button" class="btn btn-ghost btn-small" data-act="use-mat" data-id="' + escapeHtml(job.id) + '">Trekk fra lager</button>' +
      "</div>";
    }
    return '<div class="job-materials"><p class="note" style="margin:0 0 0.35rem"><strong>Materialer brukt</strong></p>' + list + picker + "</div>";
  }

  jobList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var act = btn.getAttribute("data-act");
    var job = data.jobs.find(function (j) { return j.id === id; });
    if (!job) return;
    if (act === "edit") fillJobForm(job);
    if (act === "status") {
      job.status = btn.getAttribute("data-status");
      save(data);
      renderJobs();
    }
    if (act === "delete") {
      if (!confirm("Slette oppdraget for " + job.customer + "?")) return;
      data.jobs = data.jobs.filter(function (j) { return j.id !== id; });
      save(data);
      renderJobs();
      setStatus("Oppdraget er slettet.");
    }
    if (act === "use-mat") {
      var box = btn.closest(".job-materials");
      var sel = box.querySelector("select");
      var qtyEl = box.querySelector("input");
      var qty = parseFloat(String(qtyEl.value).replace(",", "."));
      if (!sel || !(qty > 0)) return;
      var stock = window.VL.loadLager();
      var item = stock.find(function (i) { return i.id === sel.value; });
      if (!item) return;
      if (item.qty < qty && !confirm(item.name + " har bare " + item.qty + " " + (item.unit || "") + " på lager. Trekk likevel?")) return;
      item.qty = Math.max(0, Math.round((item.qty - qty) * 100) / 100);
      window.VL.saveLager(stock);
      job.materialsUsed = job.materialsUsed || [];
      job.materialsUsed.push({ id: item.id, name: item.name, qty: qty, unit: item.unit });
      save(data);
      renderJobs();
      setStatus("Trukket " + qty + " " + (item.unit || "") + " " + item.name + " fra lageret.");
    }
  });

  /* Recurring snow customers */
  var customerForm = document.getElementById("kunde-skjema");
  var customerList = document.getElementById("kunde-liste");

  function resetCustomerForm() {
    customerForm.reset();
    document.getElementById("kunde-id").value = "";
    document.getElementById("kunde-lagre").textContent = "Lagre kunde";
    document.getElementById("kunde-avbryt").classList.add("hidden");
  }

  customerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var rec = {
      id: document.getElementById("kunde-id").value || uid(),
      name: document.getElementById("fast-navn").value.trim(),
      phone: document.getElementById("fast-telefon").value.trim(),
      address: document.getElementById("fast-adresse").value.trim(),
      notes: document.getElementById("fast-notat").value.trim()
    };
    if (!rec.name) return;
    var idx = data.customers.findIndex(function (c) { return c.id === rec.id; });
    if (idx >= 0) data.customers[idx] = rec;
    else data.customers.unshift(rec);
    save(data);
    resetCustomerForm();
    renderCustomers();
    setStatus("Kunden er lagret i denne nettleseren.");
  });

  document.getElementById("kunde-avbryt").addEventListener("click", resetCustomerForm);

  function renderCustomers() {
    if (!data.customers.length) {
      customerList.innerHTML = '<p class="empty">Ingen faste snømåkingskunder ennå.</p>';
      return;
    }
    customerList.innerHTML = data.customers.map(function (c) {
      var phone = c.phone
        ? (telHref(c.phone)
          ? '<a href="' + escapeHtml(telHref(c.phone)) + '">' + escapeHtml(c.phone) + "</a>"
          : escapeHtml(c.phone))
        : "";
      var meta = [phone, escapeHtml(c.address)].filter(Boolean).join(" · ");
      var notes = c.notes ? "<p class=\"notes\">" + escapeHtml(c.notes) + "</p>" : "";
      return (
        '<article class="job">' +
          '<div class="job-top"><div><h3>' + escapeHtml(c.name) + "</h3>" +
          (meta ? "<p class=\"meta\">" + meta + "</p>" : "") + notes + "</div></div>" +
          '<div class="job-actions">' +
            '<button type="button" class="btn btn-ghost btn-small" data-cact="edit" data-id="' + escapeHtml(c.id) + '">Rediger</button>' +
            '<button type="button" class="btn btn-ghost btn-small" data-cact="job" data-id="' + escapeHtml(c.id) + '">Nytt oppdrag</button>' +
            '<button type="button" class="btn btn-ghost btn-small" data-cact="delete" data-id="' + escapeHtml(c.id) + '">Slett</button>' +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  customerList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cact]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var rec = data.customers.find(function (c) { return c.id === id; });
    if (!rec) return;
    var act = btn.getAttribute("data-cact");
    if (act === "edit") {
      document.getElementById("kunde-id").value = rec.id;
      document.getElementById("fast-navn").value = rec.name || "";
      document.getElementById("fast-telefon").value = rec.phone || "";
      document.getElementById("fast-adresse").value = rec.address || "";
      document.getElementById("fast-notat").value = rec.notes || "";
      document.getElementById("kunde-lagre").textContent = "Oppdater kunde";
      document.getElementById("kunde-avbryt").classList.remove("hidden");
      document.getElementById("fast-navn").focus();
    }
    if (act === "job") {
      resetJobForm();
      document.getElementById("kunde").value = rec.name || "";
      document.getElementById("jobb-telefon").value = rec.phone || "";
      document.getElementById("jobb-adresse").value = rec.address || "";
      document.getElementById("jobb-type").value = "Snømåking";
      document.getElementById("jobb-status").value = "planlagt";
      showTab("oppdrag");
      document.getElementById("jobb-dato").focus();
    }
    if (act === "delete") {
      if (!confirm("Slette " + rec.name + " fra listen over faste kunder?")) return;
      data.customers = data.customers.filter(function (c) { return c.id !== id; });
      save(data);
      renderCustomers();
      setStatus("Kunden er slettet.");
    }
  });

  /* Export / import */
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

  function csvEscape(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsv() {
    var lines = ["kind;id;name;phone;address;type;date;status;price;notes"];
    data.jobs.forEach(function (j) {
      lines.push(["job", j.id, j.customer, j.phone, j.address, j.type, j.date, j.status, j.price, j.notes].map(csvEscape).join(";"));
    });
    data.customers.forEach(function (c) {
      lines.push(["customer", c.id, c.name, c.phone, c.address, "Snømåking", "", "", "", c.notes].map(csvEscape).join(";"));
    });
    return lines.join("\n");
  }

  document.getElementById("eksport-json").addEventListener("click", function () {
    var payload = { version: 1, exportedAt: new Date().toISOString(), jobs: data.jobs, customers: data.customers };
    download("vaktmester-larsen-oppdrag.json", JSON.stringify(payload, null, 2), "application/json");
    setStatus("JSON-filen er lastet ned.");
  });

  document.getElementById("eksport-csv").addEventListener("click", function () {
    download("vaktmester-larsen-oppdrag.csv", "\uFEFF" + toCsv(), "text/csv;charset=utf-8");
    setStatus("CSV-filen er lastet ned.");
  });

  function parseCsv(text) {
    text = text.replace(/^\uFEFF/, "");
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

  function importPayload(payload) {
    if (!payload || !Array.isArray(payload.jobs) || !Array.isArray(payload.customers)) {
      throw new Error("Filen har ikke forventet format.");
    }
    data = {
      jobs: payload.jobs,
      customers: payload.customers
    };
    save(data);
    renderJobs();
    renderCustomers();
    setStatus("Data er importert og erstatter det som lå i nettleseren.");
  }

  function importCsv(text) {
    var rows = parseCsv(text);
    if (!rows.length) throw new Error("Tom CSV-fil.");
    var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var jobs = [];
    var customers = [];
    rows.slice(1).forEach(function (r) {
      if (!r.length || r.every(function (c) { return !c; })) return;
      var obj = {};
      header.forEach(function (h, i) { obj[h] = r[i] || ""; });
      var kind = (obj.kind || "job").toLowerCase();
      if (kind === "customer" || kind === "kunde") {
        customers.push({
          id: obj.id || uid(),
          name: obj.name || obj.kunde || obj.customer,
          phone: obj.phone || obj.telefon,
          address: obj.address || obj.adresse,
          notes: obj.notes || obj.notat
        });
      } else {
        jobs.push({
          id: obj.id || uid(),
          customer: obj.customer || obj.kunde || obj.name,
          phone: obj.phone || obj.telefon,
          address: obj.address || obj.adresse,
          type: obj.type || "Annet",
          date: obj.date || obj.dato,
          status: STATUS.indexOf(obj.status) >= 0 ? obj.status : "ny",
          price: obj.price || obj.pris,
          notes: obj.notes || obj.notat
        });
      }
    });
    importPayload({ jobs: jobs, customers: customers });
  }

  document.getElementById("import-fil").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Import erstatter all lagret oversikt i denne nettleseren. Vil du fortsette?")) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || "");
        if (/\.csv$/i.test(file.name) || text.indexOf("kind;") === 0 || text.indexOf("kind,") === 0) {
          importCsv(text);
        } else {
          importPayload(JSON.parse(text));
        }
      } catch (err) {
        setStatus("Kunne ikke importere filen. " + (err && err.message ? err.message : ""), true);
      }
    };
    reader.readAsText(file, "utf-8");
  });


  /* Inbox */
  var reqFilter = "ny";
  var inboxList = document.getElementById("innboks-liste");

  function loadReqs() {
    return (window.VL && window.VL.loadRequests) ? window.VL.loadRequests() : [];
  }

  function saveReqs(list) {
    if (window.VL && window.VL.saveRequests) window.VL.saveRequests(list);
  }

  function updateInboxBadges() {
    var n = loadReqs().filter(function (r) { return r.status === "ny"; }).length;
    ["innboks-merke", "innboks-tab-merke"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (n) {
        el.textContent = String(n);
        el.classList.remove("hidden");
      } else {
        el.textContent = "";
        el.classList.add("hidden");
      }
    });
  }

  function formatWhen(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      var dd = String(d.getDate()).padStart(2, "0");
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      var hh = String(d.getHours()).padStart(2, "0");
      var mi = String(d.getMinutes()).padStart(2, "0");
      return dd + "." + mm + "." + d.getFullYear() + " kl. " + hh + "." + mi;
    } catch (e) {
      return iso;
    }
  }

  function renderInbox() {
    updateInboxBadges();
    if (!inboxList) return;
    document.querySelectorAll("#innboks-filter .chip").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-rfilter") === reqFilter ? "true" : "false");
    });
    var items = loadReqs().filter(function (r) {
      if (reqFilter === "alle") return true;
      return r.status === reqFilter;
    });
    if (!items.length) {
      inboxList.innerHTML = '<p class="empty">Ingen forespørsler i denne visningen. Nye anbud fra nettsiden dukker opp her når de lagres i samme nettleser.</p>';
      return;
    }
    inboxList.innerHTML = items.map(function (r) {
      var statusLabel = r.status === "jobb" ? "Jobb" : (r.status === "lest" ? "Sett" : "Ny");
      var statusClass = r.status === "jobb" ? "ferdig" : (r.status === "lest" ? "planlagt" : "ny");
      var phone = r.phone
        ? (telHref(r.phone) ? '<a href="' + escapeHtml(telHref(r.phone)) + '">' + escapeHtml(r.phone) + "</a>" : escapeHtml(r.phone))
        : "";
      var meta = [escapeHtml(r.type), formatWhen(r.createdAt), phone, escapeHtml(r.address), escapeHtml(r.email)]
        .filter(Boolean).join(" · ");
      var extra = [];
      if (r.date) extra.push("Ønsket dato: " + formatDate(r.date));
      if (r.timeNote) extra.push(escapeHtml(r.timeNote));
      if (r.photoNote && r.photoNote !== "nei") extra.push("Bilder: " + escapeHtml(r.photoNote));
      var notes = (r.description ? "<p class=\"notes\">" + escapeHtml(r.description) + "</p>" : "") +
        (extra.length ? "<p class=\"meta\">" + extra.join(" · ") + "</p>" : "");
      var actions = r.status === "jobb"
        ? '<p class="note">Gjort om til oppdrag.</p>'
        : '<button type="button" class="btn btn-spruce btn-small" data-ract="job" data-id="' + escapeHtml(r.id) + '">Gjør om til oppdrag</button> ' +
          '<button type="button" class="btn btn-ghost btn-small" data-ract="delete" data-id="' + escapeHtml(r.id) + '">Slett</button>';
      return '<article class="job">' +
        '<div class="job-top"><div><h3>' + escapeHtml(r.name || "Uten navn") + "</h3><p class=\"meta\">" + meta + "</p>" + notes + "</div>" +
        '<span class="status status-' + statusClass + '">' + statusLabel + "</span></div>" +
        '<div class="job-actions">' + actions + "</div></article>";
    }).join("");
  }

  var innboksFilter = document.getElementById("innboks-filter");
  if (innboksFilter) {
    innboksFilter.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-rfilter]");
      if (!btn) return;
      reqFilter = btn.getAttribute("data-rfilter");
      renderInbox();
    });
  }

  if (inboxList) {
    inboxList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-ract]");
      if (!btn) return;
      var list = loadReqs();
      var rec = list.find(function (r) { return r.id === btn.getAttribute("data-id"); });
      if (!rec) return;
      var act = btn.getAttribute("data-ract");
      if (act === "delete") {
        if (!confirm("Slette forespørselen fra " + (rec.name || "ukjent") + "?")) return;
        saveReqs(list.filter(function (r) { return r.id !== rec.id; }));
        renderInbox();
        setStatus("Forespørselen er slettet.");
      }
      if (act === "job") {
        var extras = [];
        if (rec.description) extras.push(rec.description);
        if (rec.timeNote) extras.push("Tidspunkt: " + rec.timeNote);
        if (rec.photoNote && rec.photoNote !== "nei") extras.push("Bilder: " + rec.photoNote);
        if (rec.email) extras.push("E-post: " + rec.email);
        var job = {
          id: uid(),
          customer: rec.name || "Uten navn",
          phone: rec.phone || "",
          address: rec.address || "",
          type: rec.type || "Annet",
          date: rec.date || "",
          status: "ny",
          price: "",
          notes: extras.join("\n"),
          materialsUsed: [],
          requestId: rec.id
        };
        data.jobs.unshift(job);
        rec.status = "jobb";
        rec.jobId = job.id;
        save(data);
        saveReqs(list);
        renderJobs();
        renderInbox();
        showTab("oppdrag");
        setStatus("Forespørselen er gjort om til et oppdrag.");
      }
    });
  }

  function applyHash() {
    if (location.hash === "#innboks") showTab("innboks");
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();

  renderJobs();
  renderCustomers();
  renderInbox();
})();
