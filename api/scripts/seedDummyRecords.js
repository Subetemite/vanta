require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Record = require("../models/cases/Record");

function toDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createProfilePhoto(firstName, lastName, colorA, colorB) {
  const initials = `${(firstName || "N").charAt(0)}${(lastName || "A").charAt(0)}`.toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#bg)" />
      <circle cx="120" cy="92" r="42" fill="rgba(255,255,255,0.18)" />
      <path d="M56 204c10-34 38-54 64-54s54 20 64 54" fill="rgba(255,255,255,0.18)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="700">${initials}</text>
    </svg>
  `.trim();

  return {
    fileName: `${firstName.toLowerCase()}-${lastName.toLowerCase()}.svg`,
    mimeType: "image/svg+xml",
    size: Buffer.byteLength(svg, "utf8"),
    dataUrl: toDataUrl(svg),
  };
}

const groups = [
  {
    tag: "[ALPHA]",
    operationName: "[ALPHA] Harbor Watch Sweep",
    operationAddress: "12 Coastal Watch Road, Barangay San Roque, Manila",
    address: "12 Coastal Watch Road, Barangay San Roque, Manila",
    palette: ["#0f766e", "#06b6d4"],
    records: [
      ["Mateo", "Cruz", "Falcon"],
      ["Lia", "Santos", "Harbor"],
      ["Noel", "Reyes", "Beacon"],
      ["Aira", "Mendoza", "Tide"],
      ["Paolo", "Garcia", "Anchor"],
    ],
  },
  {
    tag: "[BRAVO]",
    operationName: "[BRAVO] North Station Census",
    operationAddress: "88 Mabini Extension, Barangay North Fairview, Quezon City",
    address: "88 Mabini Extension, Barangay North Fairview, Quezon City",
    palette: ["#4f46e5", "#8b5cf6"],
    records: [
      ["Dianne", "Flores", "Orbit"],
      ["Rafael", "Torres", "Signal"],
      ["Jessa", "Navarro", "Echo"],
      ["Marco", "Aquino", "Vector"],
      ["Trina", "Castro", "Pulse"],
    ],
  },
  {
    tag: "[CHARLIE]",
    operationName: "[CHARLIE] South Gate Verification",
    operationAddress: "45 Sampaguita Street, Barangay Poblacion, Davao City",
    address: "45 Sampaguita Street, Barangay Poblacion, Davao City",
    palette: ["#be123c", "#fb7185"],
    records: [
      ["Ivy", "Domingo", "Lantern"],
      ["Ken", "Salazar", "Summit"],
      ["Mae", "Villanueva", "Quartz"],
      ["Luis", "Herrera", "Cinder"],
      ["Nina", "Delos Reyes", "Grove"],
    ],
  },
];

function buildRecord(group, person, index) {
  const [firstName, lastName, alias] = person;
  const birthMonth = String((index % 9) + 1).padStart(2, "0");
  const birthDay = String(((index + 3) * 2) % 28 || 14).padStart(2, "0");
  const opDay = String((index + 10) % 28 || 18).padStart(2, "0");
  const isMale = index % 2 === 0;

  return {
    personalInformation: {
      firstName,
      middleName: "Sample",
      alias,
      lastName,
      sex: isMale ? "Male" : "Female",
      civilStatus: index % 3 === 0 ? "Married" : "Single",
      birthDate: `199${index % 10}-${birthMonth}-${birthDay}`,
      contactNumber: `0917${String(3000000 + index * 13791).slice(0, 7)}`,
      emailAddress: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@dummy.vanta.local`,
      nationality: "Filipino",
      country: "Philippines",
      address: group.address,
    },
    operationDetails: {
      operationName: group.operationName,
      operationAddress: group.operationAddress,
      operationDate: `2026-03-${opDay}`,
      disposition: index % 2 === 0 ? "For processing" : "Under investigation",
      visaStatus: "Not applicable",
      remarks: `Dummy batch seed ${group.tag} for dashboard testing.`,
      actions: `Tagged under ${group.tag} grouped registration set.`,
    },
    biometrics: {
      heightCm: 155 + index * 3,
      weightKg: 50 + index * 2,
      bloodType: ["A+", "B+", "O+", "AB+"][index % 4],
      eyeColor: "Brown",
      hairColor: "Black",
      complexion: ["Light", "Medium", "Morena"][index % 3],
      distinguishingMarks: `${alias} mark`,
      fingerprintCode: `${group.tag.replace(/[\[\]]/g, "")}-${index + 1}-FP`,
    },
    profilePhoto: createProfilePhoto(firstName, lastName, group.palette[0], group.palette[1]),
  };
}

async function seed() {
  await connectDB();

  const payload = groups.flatMap((group) =>
    group.records.map((person, index) => buildRecord(group, person, index))
  );

  const inserted = await Record.insertMany(payload);

  console.log(`Inserted ${inserted.length} dummy records.`);
  groups.forEach((group) => {
    console.log(`${group.tag} ${group.operationName} :: ${group.address}`);
  });
}

seed()
  .catch((error) => {
    console.error("Failed to seed dummy records:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
