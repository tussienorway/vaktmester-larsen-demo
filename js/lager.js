(function () {
  var items = window.VL.loadLager();
  var filter = "alle";
  var statusEl = document.getElementById("lager-status");
  var form = document.getElementById("lager-skjema");

  function setStatus(text, isError) {
    statusEl.textContent = text || "";
    statusEl.classList.toggle("error", !!isError);
  }

  function num(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  function fmt(n) {
    var x = num(n);
    return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);
  }

  function isLow(item) {
    return num(item.min) > 0 && num(item.qty) <= num(item.min);
  }

  function resetForm() {
    form.reset();
    document.getElementById("vare-id").value = "";
    document.getElementById("vare-lagre").textContent = "Lagre vare";
    document.getElementById("vare-avbryt").classList.add("hidden");
    document.getElementById("vare-antall").value = "0";
    document.getElementById("vare-min").value = "0";
  }

  function fillForm(item) {
    document.getElementById("vare-id").value = item.id;
    document.getElementById("vare-navn").value = item.name || "";
    document.getElementById("vare-kategori").value = item.category || "Annet";
    document.getElementById("vare-antall").value = item.qty;
    document.getElementById("vare-enhet").value = item.unit || "";
    document.getElementById("vare-min").value = item.min || 0;
    document.getElementById("vare-sted").value = item.location || "";
    document.getElementById("vare-leverandor").value = item.supplier || "";
    document.getElementById("vare-pris").value = item.price || "";
    document.getElementById("vare-lagre").textContent = "Oppdater vare";
    document.getElementById("vare-avbryt").classList.remove("hidden");
    document.getElementById("vare-navn").focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var rec = {
      id: document.getElementById("vare-id").value || window.VL.uid(),
      name: document.getElementById("vare-navn").value.trim(),
      category: document.getElementById("vare-kategori").value,
      qty: num(document.getElementById("vare-antall").value),
      unit: document.getElementById("vare-enhet").value.trim(),
      min: num(document.getElementById("vare-min").value),
      location: document.getElementById("vare-sted").value.trim(),
      supplier: document.getElementById("vare-leverandor").value.trim(),
      price: document.getElementById("vare-pris").value.trim()
    };
    if (!rec.name) return;
    var idx = items.findIndex(function (i) { return i.id === rec.id; });
    if (idx >= 0) items[idx] = rec;
    else items.unshift(rec);
    window.VL.saveLager(items);
    resetForm();
    render();
    setStatus("Varen er lagret i denne nettleseren.");
  });

  document.getElementById("vare-avbryt").addEventListener("click", resetForm);

  document.getElementById("lager-filter").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-kat]");
    if (!btn) return;
    filter = btn.getAttribute("data-kat");
    render();
  });

  function visible() {
    return items.filter(function (i) {
      if (filter === "alle") return true;
      if (filter === "lavt") return isLow(i);
      return i.category === filter;
    });
  }

  function render() {
    var low = items.filter(isLow);
    var alert = document.getElementById("lager-varsel");
    if (low.length) {
      alert.classList.remove("hidden");
      alert.textContent = low.length + (low.length === 1 ? " vare er" : " varer er") + " på eller under minstnivå: " + low.map(function (i) { return i.name; }).join(", ") + ".";
    } else {
      alert.classList.add("hidden");
      alert.textContent = "";
    }

    document.querySelectorAll("#lager-filter .chip").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-kat") === filter ? "true" : "false");
    });

    var rows = visible();
    var tb = document.querySelector("#lager-tabell tbody");
    var empty = document.getElementById("lager-tom");
    if (!rows.length) {
      tb.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    tb.innerHTML = rows.map(function (i) {
      return "<tr class=\"" + (isLow(i) ? "low" : "") + "\" data-id=\"" + escapeHtml(i.id) + "\">" +
        "<td><strong>" + escapeHtml(i.name) + "</strong></td>" +
        "<td>" + escapeHtml(i.category) + "</td>" +
        "<td><div class=\"qty-ctrl\">" +
          "<button type=\"button\" data-act=\"dec\" aria-label=\"Reduser\">−</button>" +
          "<strong>" + fmt(i.qty) + " " + escapeHtml(i.unit) + "</strong>" +
          "<button type=\"button\" data-act=\"inc\" aria-label=\"Øk\">+</button>" +
        "</div></td>" +
        "<td>" + fmt(i.min) + " " + escapeHtml(i.unit) + "</td>" +
        "<td>" + escapeHtml(i.location) + "</td>" +
        "<td>" + escapeHtml(i.supplier) + "</td>" +
        "<td>" + escapeHtml(i.price) + "</td>" +
        "<td><button type=\"button\" class=\"btn btn-ghost btn-small\" data-act=\"edit\">Rediger</button> " +
          "<button type=\"button\" class=\"btn btn-ghost btn-small\" data-act=\"delete\">Slett</button></td>" +
      "</tr>";
    }).join("");
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.querySelector("#lager-tabell tbody").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var id = btn.closest("tr").getAttribute("data-id");
    var item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    var act = btn.getAttribute("data-act");
    if (act === "inc") item.qty = num(item.qty) + 1;
    if (act === "dec") item.qty = Math.max(0, num(item.qty) - 1);
    if (act === "edit") {
      fillForm(item);
      return;
    }
    if (act === "delete") {
      if (!confirm("Slette " + item.name + " fra lageret?")) return;
      items = items.filter(function (i) { return i.id !== id; });
    }
    window.VL.saveLager(items);
    render();
  });

  document.getElementById("lager-json").addEventListener("click", function () {
    window.VL.download("vaktmester-larsen-lager.json", JSON.stringify({ version: 1, items: items }, null, 2), "application/json");
    setStatus("JSON-filen er lastet ned.");
  });

  document.getElementById("lager-csv").addEventListener("click", function () {
    var lines = ["id;name;category;qty;unit;min;location;supplier;price"];
    items.forEach(function (i) {
      lines.push([i.id, i.name, i.category, i.qty, i.unit, i.min, i.location, i.supplier, i.price].map(window.VL.csvEscape).join(";"));
    });
    window.VL.download("vaktmester-larsen-lager.csv", "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
    setStatus("CSV-filen er lastet ned.");
  });

  document.getElementById("lager-import").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Import erstatter hele lageret i denne nettleseren. Vil du fortsette?")) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || "");
        if (/\.csv$/i.test(file.name) || text.indexOf("name;") === 0 || text.indexOf("id;") === 0) {
          var rows = window.VL.parseCsv(text);
          var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
          items = rows.slice(1).filter(function (r) { return r.some(Boolean); }).map(function (r) {
            var obj = {};
            header.forEach(function (h, i) { obj[h] = r[i] || ""; });
            return {
              id: obj.id || window.VL.uid(),
              name: obj.name || obj.vare,
              category: obj.category || obj.kategori || "Annet",
              qty: num(obj.qty || obj.antall),
              unit: obj.unit || obj.enhet || "stk",
              min: num(obj.min || obj.minste),
              location: obj.location || obj.plassering || obj.sted,
              supplier: obj.supplier || obj.leverandor || obj.leverandør,
              price: obj.price || obj.pris
            };
          });
        } else {
          var data = JSON.parse(text);
          items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
        }
        window.VL.saveLager(items);
        render();
        setStatus("Lageret er importert.");
      } catch (err) {
        setStatus("Kunne ikke importere filen. " + (err && err.message ? err.message : ""), true);
      }
    };
    reader.readAsText(file, "utf-8");
  });

  render();
})();
