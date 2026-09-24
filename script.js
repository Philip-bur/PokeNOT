const daten = require("./Kunde.json");

function kundenAnzeigen(kunden) {
  kunden.forEach((kunde, index) => {
    console.log(`Kunde ${index + 1}:`);
    console.log(kunde);
    console.log("--------------------");
  });
}

kundenAnzeigen(daten.kunden);