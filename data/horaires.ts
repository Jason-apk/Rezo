export type ScheduleTrip = {
  busId: string;
  direction: "aller" | "retour";
  course: number;
  departTime: string; // HH:mm, terminus de départ (EU si aller, Bia si retour)
  arrivalTime: string | null; // HH:mm, terminus d'arrivée, null si non renseigné
};

export type DayType = "weekday" | "saturday";

export const L12_SCHEDULE: Record<DayType, ScheduleTrip[]> = {
  weekday: [
    // Aller (EU -> Bia) — Matin
    {
      busId: "L12-B1",
      direction: "aller",
      course: 1,
      departTime: "05:30",
      arrivalTime: "06:30",
    },
    {
      busId: "L12-B2",
      direction: "aller",
      course: 1,
      departTime: "06:00",
      arrivalTime: "07:20",
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 1,
      departTime: "06:30",
      arrivalTime: "07:50",
    },
    {
      busId: "L12-B4",
      direction: "aller",
      course: 1,
      departTime: "05:00",
      arrivalTime: "06:00",
    },

    {
      busId: "L12-B1",
      direction: "aller",
      course: 2,
      departTime: "07:30",
      arrivalTime: "08:30",
    },
    {
      busId: "L12-B2",
      direction: "aller",
      course: 2,
      departTime: "08:00",
      arrivalTime: "10:30",
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 2,
      departTime: "08:30",
      arrivalTime: "09:20",
    },
    {
      busId: "L12-B4",
      direction: "aller",
      course: 2,
      departTime: "07:00",
      arrivalTime: "08:00",
    },

    {
      busId: "L12-B1",
      direction: "aller",
      course: 3,
      departTime: "09:30",
      arrivalTime: null,
    },
    {
      busId: "L12-B2",
      direction: "aller",
      course: 3,
      departTime: "11:30",
      arrivalTime: null,
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 3,
      departTime: "10:00",
      arrivalTime: null,
    },
    {
      busId: "L12-B4",
      direction: "aller",
      course: 3,
      departTime: "09:00",
      arrivalTime: "11:30",
    },

    // Aller — Midi
    {
      busId: "L12-B1",
      direction: "aller",
      course: 4,
      departTime: "11:20",
      arrivalTime: "12:20",
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 4,
      departTime: "13:00",
      arrivalTime: "14:00",
    },
    {
      busId: "L12-B4",
      direction: "aller",
      course: 4,
      departTime: "13:00",
      arrivalTime: null,
    },
    {
      busId: "L12-B1",
      direction: "aller",
      course: 5,
      departTime: "14:00",
      arrivalTime: null,
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 5,
      departTime: "15:30",
      arrivalTime: null,
    },

    // Retour (Bia -> EU) — Soir
    {
      busId: "L12-B1",
      direction: "retour",
      course: 1,
      departTime: "15:30",
      arrivalTime: "16:30",
    },
    {
      busId: "L12-B2",
      direction: "retour",
      course: 1,
      departTime: "16:00",
      arrivalTime: "17:00",
    },
    {
      busId: "L12-B3",
      direction: "retour",
      course: 1,
      departTime: "16:30",
      arrivalTime: "17:30",
    },
    {
      busId: "L12-B4",
      direction: "retour",
      course: 1,
      departTime: "17:00",
      arrivalTime: "18:00",
    },

    {
      busId: "L12-B1",
      direction: "retour",
      course: 2,
      departTime: "17:30",
      arrivalTime: "18:30",
    },
    {
      busId: "L12-B2",
      direction: "retour",
      course: 2,
      departTime: "18:00",
      arrivalTime: "19:00",
    },
    {
      busId: "L12-B3",
      direction: "retour",
      course: 2,
      departTime: "18:20",
      arrivalTime: "19:20",
    },
    {
      busId: "L12-B4",
      direction: "retour",
      course: 2,
      departTime: "19:00",
      arrivalTime: null,
    },

    {
      busId: "L12-B1",
      direction: "retour",
      course: 3,
      departTime: "19:30",
      arrivalTime: null,
    },
  ],

  saturday: [
    // Aller (EU -> Bia) — Matin
    {
      busId: "L12-B1",
      direction: "aller",
      course: 1,
      departTime: "05:30",
      arrivalTime: "06:30",
    },
    {
      busId: "L12-B2",
      direction: "aller",
      course: 1,
      departTime: "06:00",
      arrivalTime: "07:00",
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 1,
      departTime: "06:30",
      arrivalTime: "07:30",
    },

    {
      busId: "L12-B1",
      direction: "aller",
      course: 2,
      departTime: "07:30",
      arrivalTime: "08:30",
    },
    {
      busId: "L12-B2",
      direction: "aller",
      course: 2,
      departTime: "08:00",
      arrivalTime: "10:30",
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 2,
      departTime: "08:30",
      arrivalTime: "11:30",
    },

    {
      busId: "L12-B1",
      direction: "aller",
      course: 3,
      departTime: "09:30",
      arrivalTime: null,
    },
    {
      busId: "L12-B2",
      direction: "aller",
      course: 3,
      departTime: "11:30",
      arrivalTime: null,
    },

    // Aller — Midi
    {
      busId: "L12-B1",
      direction: "aller",
      course: 4,
      departTime: "11:20",
      arrivalTime: "12:20",
    },
    {
      busId: "L12-B3",
      direction: "aller",
      course: 4,
      departTime: "13:00",
      arrivalTime: null,
    },
    {
      busId: "L12-B1",
      direction: "aller",
      course: 5,
      departTime: "14:00",
      arrivalTime: null,
    },

    // Retour (Bia -> EU) — Soir
    {
      busId: "L12-B1",
      direction: "retour",
      course: 1,
      departTime: "16:00",
      arrivalTime: "16:50",
    },
    {
      busId: "L12-B2",
      direction: "retour",
      course: 1,
      departTime: "16:30",
      arrivalTime: "17:20",
    },
    {
      busId: "L12-B3",
      direction: "retour",
      course: 1,
      departTime: "17:00",
      arrivalTime: "18:00",
    },

    {
      busId: "L12-B1",
      direction: "retour",
      course: 2,
      departTime: "17:40",
      arrivalTime: "18:40",
    },
    {
      busId: "L12-B2",
      direction: "retour",
      course: 2,
      departTime: "18:30",
      arrivalTime: null,
    },
    {
      busId: "L12-B3",
      direction: "retour",
      course: 2,
      departTime: "19:00",
      arrivalTime: null,
    },
  ],
};

export function getDayType(date: Date = new Date()): DayType | "sunday" {
  const day = date.getDay(); // 0=dimanche, 6=samedi
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekday";
}

export function getNextScheduledTrip(
  direction: "aller" | "retour",
  now: Date = new Date(),
): ScheduleTrip | null {
  const dayType = getDayType(now);
  if (dayType === "sunday") return null; // pas de service dimanche, à confirmer

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const trips = L12_SCHEDULE[dayType].filter((t) => t.direction === direction);

  const upcoming = trips
    .map((t) => {
      const [h, m] = t.departTime.split(":").map(Number);
      return { trip: t, minutes: h * 60 + m };
    })
    .filter((x) => x.minutes >= nowMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  return upcoming[0]?.trip ?? null;
}
