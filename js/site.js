(function () {
  var form = document.getElementById("anbud");
  var statusEl = document.getElementById("form-status");

  function val(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    if (el.type === "checkbox") return el.checked;
    return el.value.trim();
  }

  function setField(id, value) {
    var el = document.getElementById(id);
    if (!el || value == null || value === "") return;
    if (el.type === "checkbox") el.checked = !!value;
    else el.value = value;
  }

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("error", !!isError);
  }

  function collectRequest() {
    var photos = [];
    if (val("har-bilder")) photos.push("Ja, bilder kan sendes på MMS eller e-post");
    if (val("bilde-notat")) photos.push(val("bilde-notat"));
    return {
      name: val("navn"),
      phone: val("telefon"),
      email: val("epost"),
      address: val("adresse"),
      type: val("type"),
      date: val("dato"),
      timeNote: val("tidspunkt"),
      description: val("beskrivelse"),
      photoNote: photos.join(". ") || "nei",
      source: "skjema"
    };
  }

  function valid(req) {
    if (!req.name || !req.phone || !req.description) {
      setStatus("Fyll inn navn, telefon og en kort beskrivelse.", true);
      return false;
    }
    return true;
  }

  function persistAndMaybePost(req) {
    var saved = window.VL.saveRequest(req);
    return window.VL.postEndpoint({
      _subject: "Anbud: " + (saved.type || "forespørsel"),
      name: saved.name,
      phone: saved.phone,
      email: saved.email,
      address: saved.address,
      type: saved.type,
      date: saved.date,
      timeNote: saved.timeNote,
      description: saved.description,
      photoNote: saved.photoNote,
      id: saved.id,
      createdAt: saved.createdAt
    }).then(function (res) {
      return { saved: saved, posted: !res.skipped };
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var req = collectRequest();
      if (!valid(req)) return;
      persistAndMaybePost(req).then(function (res) {
        var body = window.VL.formatRequest(res.saved);
        window.location.href = window.VL.smsHref(body);
        setStatus("Forespørselen er lagret i denne nettleseren. Åpner SMS-appen." + (res.posted ? " Den er også sendt til serveren." : ""));
      }).catch(function (err) {
        var body = window.VL.formatRequest(req);
        window.location.href = window.VL.smsHref(body);
        setStatus("Lagret lokalt og åpner SMS. Serverinnsending feilet: " + (err && err.message ? err.message : "ukjent feil"), true);
      });
    });

    document.getElementById("anbud-kopier").addEventListener("click", function () {
      var req = collectRequest();
      if (!valid(req)) return;
      persistAndMaybePost(req).then(function (res) {
        var body = window.VL.formatRequest(res.saved);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(body).then(function () {
            setStatus("Forespørselen er lagret, og teksten er kopiert. Du kan lime den inn i SMS eller e-post.");
          });
        }
        window.prompt("Kopier teksten:", body);
        setStatus("Forespørselen er lagret. Kopier teksten i feltet som vises.");
      }).catch(function () {
        setStatus("Lagret lokalt, men noe gikk galt med kopiering eller innsending.", true);
      });
    });
  }

  window.VLPrefillAnbud = function (fields) {
    if (!fields) return;
    setField("navn", fields.name);
    setField("telefon", fields.phone);
    setField("epost", fields.email);
    setField("adresse", fields.address);
    setField("type", fields.type);
    setField("dato", fields.date);
    setField("tidspunkt", fields.timeNote);
    setField("beskrivelse", fields.description);
    if (fields.photoNote) setField("bilde-notat", fields.photoNote);
    var formEl = document.getElementById("anbud");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* Rule-based secretary */
  var INTENTS = [
    {
      id: "snopris",
      keys: ["snø", "sno", "måk", "mak", "brøyt", "broyt", "innkjørsel", "innkjorsel"],
      require: ["pris", "koster", "kr", "kostnad", "betale", "dyrt", "billig", "sesong"],
      answer: "Veiledende markedsnivå for måking av en vanlig privat innkjørsel er ofte 800–1 500 kr per gang, eller 4 000–10 000 kr for en sesongavtale. Dette er typiske tall fra 2025–2026, ikke Lasses fastsatte priser. Endelig pris avtales etter oppdraget. Strøing av mindre flater ligger ofte på 300–800 kr per gang.",
      fill: { type: "Snømåking" }
    },
    {
      id: "priser",
      keys: ["pris", "koster", "timepris", "kroner", "kostnad", "betale", "dyrt", "billig", "veiledende", "hva koster"],
      answer: "Veiledende markedsnivå (ikke Lasses egne priser): timepris for praktisk arbeid typisk 550–800 kr, lite enkeltoppdrag ofte 1 800–4 000 kr, snømåking av privat innkjørsel 800–1 500 kr per gang eller 4 000–10 000 kr for sesongen. Eget utrykningsgebyr er ikke et fast markedstall; mange tar oppstart med i prisen per gang, og kveld/helg gir ofte tillegg. Alle tall er veiledende, eks./inkl. mva – endelig pris etter avtale.",
      href: "#priser"
    },
    {
      id: "tjenester",
      keys: ["tjeneste", "tilbyr", "hva gjør", "hva gjor", "hjelp", "jobb", "vaktmester", "praktisk", "arbeid"],
      answer: "Vaktmester Larsen tilbyr snømåking og praktiske oppdrag i lokalområdet. Usikker på om en jobb passer? Send en forespørsel eller ring 90 90 65 00, så avklarer Lasse det.",
      fill: { type: "Praktisk oppdrag" }
    },
    {
      id: "snø",
      keys: ["snø", "sno", "måk", "mak", "brøyt", "broyt", "vinter", "innkjørsel", "innkjorsel", "strø", "stro"],
      answer: "Ja, snømåking av innkjørsel, gangvei og gårdsplass er en hovedtjeneste. Du kan be om hjelp én gang, eller jevnlig gjennom vinteren. Si også fra hvis du trenger strøing.",
      fill: { type: "Snømåking" }
    },
    {
      id: "område",
      keys: ["område", "omrade", "hvor", "hof", "holmestrand", "kjører", "kjorer", "dekker", "kommune", "nærhet", "narhet"],
      answer: "Base er Hamnehagen 8 i Hof, Holmestrand kommune. Oppdrag tas i Hof og Holmestrand, andre steder etter avtale."
    },
    {
      id: "tid",
      keys: ["åpning", "apning", "åpent", "apent", "stengt", "tid", "når", "nar", "lørdag", "lordag", "søndag", "sondag", "klokke", "mandag"],
      answer: "Ifølge Google er åpningstiden mandag–fredag 07–16, lørdag og søndag stengt. Ved snøfall kan det likevel lønne seg å ta kontakt. Ring 90 90 65 00."
    },
    {
      id: "bestill",
      keys: ["bestill", "book", "anbud", "tilbud", "forespørs", "forespor", "skjema", "kontakt", "ring", "sms", "hvordan"],
      answer: "Du kan ringe eller sende SMS til 90 90 65 00, eller fylle ut skjemaet «Be om tilbud» på denne siden. Forespørselen kan sendes som SMS, og i demoen lagres den også i nettleseren. Vil du at jeg fyller inn skjemaet med det du allerede har skrevet?",
      href: "#anbud"
    },
    {
      id: "om",
      keys: ["hvem", "lasse", "org", "organisasjons", "mva", "firma", "foretak"],
      answer: "Vaktmester Larsen er et enkeltpersonforetak drevet av Lasse Larsen. Organisasjonsnummer 933 572 056, registrert 7. juni 2024 og merverdiavgiftsregistrert. Adressen er Hamnehagen 8, 3090 Hof."
    }
  ];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[?!.:,;]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasAny(text, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (text.indexOf(keys[i]) >= 0) return true;
    }
    return false;
  }

  function score(text, intent) {
    if (intent.require && !hasAny(text, intent.require)) return 0;
    var n = 0;
    intent.keys.forEach(function (k) {
      if (text.indexOf(k) >= 0) n += Math.max(2, k.length);
    });
    return n;
  }

  function replyTo(text) {
    var n = normalize(text);
    if (!n) return { answer: "Skriv gjerne et spørsmål om priser, tjenester, område eller hvordan du ber om tilbud.", href: null, fill: null };
    var best = null;
    var bestScore = 0;
    INTENTS.forEach(function (intent) {
      var s = score(n, intent);
      if (s > bestScore) {
        best = intent;
        bestScore = s;
      }
    });
    if (!best || bestScore < 3) {
      return {
        answer: "Jeg er en enkel hjelper på siden og kan svare på tjenester, veiledende priser, område, åpningstider og hvordan du ber om tilbud. For andre spørsmål, ring 90 90 65 00.",
        href: "#anbud",
        fill: null
      };
    }
    return best;
  }

  var panel = document.getElementById("chat-panel");
  var log = document.getElementById("chat-log");
  var openBtn = document.getElementById("chat-open");
  var closeBtn = document.getElementById("chat-close");
  var chatForm = document.getElementById("chat-form");
  var chatInput = document.getElementById("chat-input");

  function addBubble(role, html) {
    var div = document.createElement("div");
    div.className = "bubble bubble-" + role;
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showBot(intent, userText) {
    var actions = '<div class="chat-actions">';
    if (intent.href === "#priser" || intent.id === "priser" || intent.id === "snopris") {
      actions += '<a class="btn btn-ghost btn-small" href="#priser">Se priser</a>';
    }
    actions += '<button type="button" class="btn btn-amber btn-small" data-fill="1">Fyll inn forespørsel</button>';
    actions += "</div>";
    addBubble("bot", "<p>" + escapeHtml(intent.answer) + "</p>" + actions);
    var btn = log.lastChild.querySelector("[data-fill]");
    if (btn) {
      btn.addEventListener("click", function () {
        var fill = Object.assign({}, intent.fill || {}, { type: (intent.fill && intent.fill.type) || "Praktisk oppdrag" });
        if (userText && !fill.description) fill.description = userText;
        window.VLPrefillAnbud(fill);
        setOpen(false);
      });
    }
  }

  function greet() {
    if (log.dataset.ready) return;
    log.dataset.ready = "1";
    addBubble("bot", "<p>Hei. Jeg kan svare på vanlige spørsmål om tjenester, veiledende priser, område og åpningstider, og hjelpe deg i gang med en forespørsel. Jeg er en regelbasert hjelper, ikke en stor språkmodell.</p>");
  }

  function setOpen(open) {
    panel.hidden = !open;
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      greet();
      chatInput.focus();
    }
  }

  if (openBtn && panel) {
    openBtn.addEventListener("click", function () { setOpen(panel.hidden); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = chatInput.value.trim();
      if (!text) return;
      addBubble("user", "<p>" + escapeHtml(text) + "</p>");
      chatInput.value = "";
      showBot(replyTo(text), text);
    });
    document.getElementById("chat-quick").addEventListener("click", function (e) {
      var q = e.target.getAttribute("data-q");
      if (!q) return;
      setOpen(true);
      addBubble("user", "<p>" + escapeHtml(q) + "</p>");
      showBot(replyTo(q), q);
    });
    window.VLOpenChat = function () { setOpen(true); };
  }
})();
