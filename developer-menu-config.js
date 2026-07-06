(function () {
  "use strict";

  window.TT_DEVELOPER_MENU = [
    {
      id: "teacher",
      title: "Teacher Build",
      description: "Planning, live teaching, Wilson flow, records, and export surfaces.",
      items: [
        {
          title: "Teacher Dashboard",
          description: "Main Teach Today home with group cards, quick planning, current lesson launch, and reader selectors.",
          href: "TeachToday.html?devRoute=home",
          status: "Core"
        },
        {
          title: "Lesson Builder / Planner",
          description: "Dashboard-first lesson builder with substep, level, page, passage, and approach controls.",
          href: "TeachToday.html?devRoute=planner",
          status: "Core"
        },
        {
          title: "Live Lesson Flow",
          description: "Full live-teaching view with Sections 1-10, presentation controls, charting, dictation, and pacing.",
          href: "TeachToday.html?devRoute=lesson-flow",
          status: "Core"
        },
        {
          title: "Wilson Section 9 Reader",
          description: "Direct jump to the Section 9 passage surface, annotation rail, story memory, and companion questions.",
          href: "TeachToday.html?devRoute=section9",
          status: "Core"
        },
        {
          title: "Wrap-up Cockpit",
          description: "End-of-lesson area for attendance, charting, missed words, notes, status, and next-step recommendation.",
          href: "TeachToday.html?devRoute=wrap-up",
          status: "Core"
        },
        {
          title: "Records / Data Center",
          description: "Teacher records panel with backups, sync status, CSV export, Drive audio, and Firebase actions.",
          href: "TeachToday.html?devRoute=records",
          status: "Admin"
        },
        {
          title: "Wilson Export Ribbon",
          description: "Live lesson top ribbon where PDF, Wilson LP, and fillable Wilson PDF exports are launched.",
          href: "TeachToday.html?devRoute=exports",
          status: "Export"
        }
      ]
    },
    {
      id: "students",
      title: "Student Experience",
      description: "Student app, lesson shell, profiles, projected display, and report pages.",
      items: [
        {
          title: "Student Homepage",
          description: "Student code-login app with home, tasks, map, games, rewards, and developer-opened lesson locks.",
          href: "student.html?developer=1",
          status: "Student"
        },
        {
          title: "Student Lesson Lab",
          description: "Direct student lesson shell for Sub-step 2.1 with developer access enabled for all activity sets.",
          href: "student-lesson.html?developer=1&studentId=developer&student=Developer&group=developer&groupName=Developer&substep=2.1&route=hero",
          status: "Dev"
        },
        {
          title: "Student Profile",
          description: "Teacher-facing student profile with comparison tables, app activity, audio evidence, and reports.",
          href: "StudentProfile.html",
          status: "Core"
        },
        {
          title: "Presenter Stage",
          description: "Clean projected/student display surface for privacy, poster, HFW, chart, passage, and game modes.",
          href: "StudentDisplay.html",
          status: "Display"
        },
        {
          title: "Student Progress Report",
          description: "Printable report page for progress summaries and teacher-facing student evidence.",
          href: "StudentReport.html",
          status: "Report"
        }
      ]
    },
    {
      id: "games",
      title: "Games and World Cup",
      description: "Game hub, mini-games, shared points, and Letter Soccer Championship Cup.",
      items: [
        {
          title: "Game Hub",
          description: "Student game chooser with name picker, shared points, leaderboard, and multiplayer lobby.",
          href: "Games/index.html?developer=1",
          status: "Core"
        },
        {
          title: "World Cup Mode",
          description: "Letter Soccer opened straight into Championship Cup match setup for faster tournament testing.",
          href: "Games/Letter%20Soccer/index.html?developer=1&student=Developer&matchType=cup&mode=classic&difficulty=Rookie",
          status: "Game"
        },
        {
          title: "Letter Soccer",
          description: "Soccer word game with teams, difficulty, modes, series matches, multiplayer, and cup logic.",
          href: "Games/Letter%20Soccer/index.html?developer=1&student=Developer",
          status: "Game"
        },
        {
          title: "Letter Hunt",
          description: "Letter collection race game with hazards, CPU opponent, and game-hub point reporting.",
          href: "Games/Letter%20Hunt/index.html?developer=1&student=Developer",
          status: "Game"
        },
        {
          title: "Decode Dash",
          description: "Runner-style decoding game for quick sound/word choice practice.",
          href: "Games/Decode%20Dash/index.html?developer=1&student=Developer",
          status: "Game"
        },
        {
          title: "Word Builder",
          description: "Tile-building game for Wilson 1.3 words, syllable marking, and bonus scoring.",
          href: "Games/Word%20Builder/index.html?developer=1&student=Developer",
          status: "Game"
        },
        {
          title: "Syllable Slice",
          description: "Syllable division game with speed bonuses, boss rounds, and hub scoring.",
          href: "Games/Syllable%20Slice/index.html?developer=1&student=Developer",
          status: "Game"
        },
        {
          title: "Cursive Stroke Lab",
          description: "Wilson cursive tracing game with saved players, letter mastery, and shared points.",
          href: "Games/Cursive%20Tracing%20WIlson/index.html?developer=1&student=Developer",
          status: "Game"
        },
        {
          title: "Syllable Sprint",
          description: "Older standalone syllable game surface kept for regression checks.",
          href: "syllable-sprint.html?developer=1&student=Developer",
          status: "Test"
        }
      ]
    },
    {
      id: "references",
      title: "References and Dev Pages",
      description: "Reader prep, PDF surfaces, legacy shells, prototypes, and unfinished/testing pages.",
      items: [
        {
          title: "Section 9 Passage Prep",
          description: "Companion-content review page for Reader passage vocabulary, support questions, and stretch questions.",
          href: "Section9PassagePrep.html",
          status: "Core"
        },
        {
          title: "Reference PDFs",
          description: "Reader and dictation PDF browser with current-page helpers used by the teaching ribbon.",
          href: "ReferencePdfs.html",
          status: "Reference"
        },
        {
          title: "PDF Viewer",
          description: "Classroom PDF focus-stage surface for page viewing and marking workflows.",
          href: "PdfViewer.html",
          status: "Reference"
        },
        {
          title: "Legacy Teacher Shell",
          description: "Original dashboard-style shell kept around for comparison with the live Teach Today app.",
          href: "index.html",
          status: "Legacy"
        },
        {
          title: "Command Center Prototype",
          description: "Alternate command-center layout and earlier teacher dashboard experiment.",
          href: "command-center.html",
          status: "Test"
        },
        {
          title: "Lesson 2.1 Student Drill",
          description: "Standalone welded-sounds drill page launched from older student tasks.",
          href: "lesson-21-s1.html?developer=1&student=Developer&source=developer-dashboard",
          status: "Prototype"
        }
      ]
    }
  ];
})();
