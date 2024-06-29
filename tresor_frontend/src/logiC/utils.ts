const units = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
];
const teens = [
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];
const tens = [
  "",
  "dix",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingt",
  "quatre-vingt-dix",
];
export function formatAmount(n: number): string {
  // 1234567 => 1 234 567,00

  let ret = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  ret = ret.replace(".", ",");
  if (ret.indexOf(",") === -1) ret += ",00";
  if (ret.split(",")[1].length === 1) ret += "0";

  return ret;
}
export function numberToFrench(n: number): string {
  if (n === 0) return "zéro";
  if (n < 0) return "moins " + numberToFrench(-n);

  let words = "";

  if (Math.floor(n / 1000000) > 0) {
    words +=
      numberToFrench(Math.floor(n / 1000000)) +
      " million" +
      (Math.floor(n / 1000000) > 1 ? "s " : " ");
    n %= 1000000;
  }

  if (Math.floor(n / 1000) > 0) {
    if (Math.floor(n / 1000) === 1) {
      words += "mille ";
    } else {
      words += numberToFrench(Math.floor(n / 1000)) + " mille ";
    }
    n %= 1000;
  }

  if (Math.floor(n / 100) > 0) {
    words +=
      numberToFrench(Math.floor(n / 100)) +
      " cent" +
      (Math.floor(n / 100) > 1 ? "s " : " ");
    n %= 100;
  }

  if (n > 0) {
    if (n < 20) {
      words += n < 10 ? units[n] : teens[n - 10];
    } else {
      if (n >= 70 && n < 80) {
        words += "soixante-" + teens[n - 70];
      } else if (n >= 90) {
        words += "quatre-vingt-" + teens[n - 90];
      } else {
        words += tens[Math.floor(n / 10)];
        if (n % 10 > 0) {
          if (Math.floor(n / 10) === 7 || Math.floor(n / 10) === 9) {
            words += "-" + teens[n % 10];
          } else if (Math.floor(n / 10) !== 8) {
            words += "-" + units[n % 10];
          } else {
            words += "s-" + units[n % 10];
          }
        }
      }
    }
  }

  return words.trim();
}

export function formatDate(date: string): string {
  return date.split("-").reverse().join("/");
}
