export const CLASSES = ["6","7","8","9","10","11","12"];
export const MEDIUMS = ["English","Hindi"];
export const DIFFICULTIES = ["Easy","Medium","Hard","Mixed"];
export const COUNTS = [5,10,15,20,25,30];
export const QUESTION_TYPES = [
  { id: "mcq", label: "MCQ" },
  { id: "true_false", label: "True / False" },
  { id: "fill_blank", label: "Fill in the Blanks" },
  { id: "one_word", label: "One-Word Answer" },
  { id: "short_answer", label: "Short Answer" },
  { id: "long_answer", label: "Long Answer" },
  { id: "assertion_reason", label: "Assertion & Reason" },
  { id: "match", label: "Match the Following" },
  { id: "case_based", label: "Case-Based" }
];
export const SUB_SUBJECTS = {
  "Social Science": ["History", "Geography", "Civics", "Economics"],
  English: ["Grammar", "First Flight", "Footprints Without Feet", "Writing Skills", "Reading"],
  Hindi: ["Vyakaran", "Gadya", "Padya", "Lekhan"]
};
const LANG = {
  Grammar: ["Tenses", "Modals", "Subject-Verb Agreement", "Active and Passive Voice", "Reported Speech", "Determiners", "Prepositions", "Conjunctions"],
  Literature: ["Prose", "Poetry", "Supplementary Reader", "Drama and Dialogues"],
  "First Flight": ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories About Flying", "From the Diary of Anne Frank", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "The Sermon at Benares", "The Proposal", "Dust of Snow (Poem)", "Fire and Ice (Poem)", "A Tiger in the Zoo (Poem)", "How to Tell Wild Animals (Poem)", "The Ball Poem", "Amanda! (Poem)", "The Trees (Poem)", "Fog (Poem)", "The Tale of Custard the Dragon (Poem)", "For Anne Gregory (Poem)"],
  "Footprints Without Feet": ["A Triumph of Surgery", "The Thief's Story", "The Midnight Visitor", "A Question of Trust", "Footprints Without Feet", "The Making of a Scientist", "The Necklace", "Bholi", "The Book That Saved the Earth"],
  "Writing Skills": ["Notice Writing", "Letter Writing", "Paragraph Writing", "Essay Writing", "Diary Entry", "Story Writing", "Analytical Paragraph"],
  Reading: ["Unseen Passage (Factual)", "Unseen Passage (Discursive)", "Case-based Passage"],
  Vyakaran: ["Sangya", "Sarvanam", "Visheshan", "Kriya", "Kaal", "Sandhi", "Samas", "Muhavare", "Lokoktiyan", "Ras"],
  Gadya: ["Kahani", "Nibandh", "Yatra Vritant", "Sansmaran", "Vyangya Rachna"],
  Padya: ["Kabir ke Dohe", "Meera ke Pad", "Tulsidas", "Rahim ke Dohe", "Aadhunik Kavita"],
  Lekhan: ["Anuched Lekhan", "Patra Lekhan", "Vigyapan Lekhan", "Sandesh Lekhan", "Samvad Lekhan"]
};
const SST = {
  History: {
    "6": ["What, Where, How and When?", "From Hunting-Gathering to Growing Food", "In the Earliest Cities", "Kingdoms, Kings and an Early Republic", "New Questions and Ideas"],
    "7": ["Tracing Changes Through a Thousand Years", "New Kings and Kingdoms", "The Delhi Sultans", "The Mughal Empire", "Towns, Traders and Craftspersons"],
    "8": ["How, When and Where", "From Trade to Territory", "Ruling the Countryside", "When People Rebel", "Women, Caste and Reform"],
    "9": ["The French Revolution", "Socialism in Europe and the Russian Revolution", "Nazism and the Rise of Hitler", "Forest Society and Colonialism", "Pastoralists in the Modern World"],
    "10": ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "Print Culture and the Modern World"]
  },
  Geography: {
    "6": ["The Earth in the Solar System", "Globe: Latitudes and Longitudes", "Motions of the Earth", "Maps", "Major Domains of the Earth"],
    "7": ["Environment", "Inside Our Earth", "Our Changing Earth", "Air", "Water"],
    "8": ["Resources", "Land, Soil, Water and Vegetation", "Agriculture", "Industries", "Human Resources"],
    "9": ["India: Size and Location", "Physical Features of India", "Drainage", "Climate", "Natural Vegetation and Wildlife"],
    "10": ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources"]
  },
  Civics: {
    "6": ["What is Government?", "Key Elements of a Democratic Government", "Panchayati Raj", "Rural Livelihoods", "Urban Livelihoods"],
    "7": ["On Equality", "Role of the Government in Health", "How the State Government Works", "Growing up as Boys and Girls", "Women Change the World"],
    "8": ["The Indian Constitution", "Understanding Secularism", "Parliament and the Making of Laws", "Judiciary", "Understanding Marginalisation"],
    "9": ["What is Democracy? Why Democracy?", "Constitutional Design", "Electoral Politics", "Working of Institutions", "Democratic Rights"],
    "10": ["Power Sharing", "Federalism", "Gender, Religion and Caste", "Political Parties", "Outcomes of Democracy"]
  },
  Economics: {
    "6": ["What is Economics?", "Needs and Wants", "Goods and Services"],
    "7": ["Understanding Markets", "Role of Money", "Basic Economic Activities"],
    "8": ["Understanding the Economy", "Sectors of the Economy", "Money and Banking Basics"],
    "9": ["The Story of Village Palampur", "People as Resource", "Poverty as a Challenge", "Food Security in India"],
    "10": ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"]
  }
};
export const SUBJECTS_BY_CLASS = {
  "6": ["Mathematics","Science","Social Science","English","Hindi","Sanskrit"],
  "7": ["Mathematics","Science","Social Science","English","Hindi","Sanskrit"],
  "8": ["Mathematics","Science","Social Science","English","Hindi","Sanskrit"],
  "9": ["Mathematics","Science","Social Science","English","Hindi","Information Technology"],
  "10": ["Mathematics","Science","Social Science","English","Hindi","Information Technology"],
  "11": ["Mathematics","Physics","Chemistry","Biology","English","Information Technology"],
  "12": ["Mathematics","Physics","Chemistry","Biology","English","Information Technology"]
};
const CHAPTERS = {
  Mathematics: {
    "6": ["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Understanding Elementary Shapes", "Integers", "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra", "Ratio and Proportion", "Symmetry", "Practical Geometry"],
    "7": ["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "Triangles and Its Properties", "Comparing Quantities", "Rational Numbers", "Perimeter and Area", "Algebraic Expressions", "Exponents and Powers", "Symmetry", "Visualising Solid Shapes"],
    "8": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs"],
    "9": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics"],
    "10": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"],
    "11": ["Sets", "Relations and Functions", "Trigonometric Functions", "Complex Numbers and Quadratic Equations", "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections", "Introduction to 3D Geometry", "Limits and Derivatives", "Statistics", "Probability"],
    "12": ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"]
  },
  Science: {
    "6": ["Components of Food", "Sorting Materials into Groups", "Separation of Substances", "Getting to Know Plants", "Body Movements", "The Living Organisms", "Motion and Measurement", "Light, Shadows and Reflection", "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us"],
    "7": ["Nutrition in Plants", "Nutrition in Animals", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Respiration in Organisms", "Transportation in Animals and Plants", "Reproduction in Plants", "Motion and Time", "Electric Current and Its Effects", "Light", "Forests: Our Lifeline", "Wastewater Story"],
    "8": ["Crop Production and Management", "Microorganisms: Friend and Foe", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell: Structure and Functions", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Light", "Stars and the Solar System", "Pollution of Air and Water"],
    "9": ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Improvement in Food Resources"],
    "10": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and Its Compounds", "Life Processes", "Control and Coordination", "How Do Organisms Reproduce?", "Heredity", "Light: Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Our Environment"]
  },
  Physics: {
    "11": ["Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
    "12": ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"]
  },
  Chemistry: {
    "11": ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity", "Chemical Bonding and Molecular Structure", "Thermodynamics", "Equilibrium", "Redox Reactions", "Organic Chemistry: Basic Principles", "Hydrocarbons"],
    "12": ["Solutions", "Electrochemistry", "Chemical Kinetics", "The p-Block Elements", "The d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"]
  },
  Biology: {
    "11": ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell: The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth and Development", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and Their Elimination", "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration"],
    "12": ["Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Microbes in Human Welfare", "Biotechnology: Principles and Processes", "Biotechnology and Its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation"]
  },
  English: ["Reading Comprehension", "Grammar: Tenses", "Grammar: Modals and Voice", "Writing: Notice and Letter", "Writing: Paragraph and Essay", "Literature: Prose", "Literature: Poetry", "Vocabulary Building"],
  Hindi: ["Vyakaran", "Gadya", "Padya", "Lekhan: Anuched", "Lekhan: Patra", "Muhavare aur Lokoktiyan"],
  Sanskrit: ["Vyakaran", "Sahitya: Gadya", "Sahitya: Padya", "Sandhi", "Samas", "Pratyaya"],
  "Information Technology": ["Computer Basics", "Internet and Web", "HTML Fundamentals", "Emerging Trends: AI and Cloud", "Digital Documentation", "Spreadsheets", "Cyber Safety"]
};
export function chaptersFor(cls, subject, branch) {
  if (branch && SST[branch]) return SST[branch][cls] || SST[branch]["10"] || ["General"];
  if (branch && LANG[branch]) return LANG[branch];
  const list = CHAPTERS[subject];
  if (Array.isArray(list)) return list;
  if (list && list[cls]) return list[cls];
  const anyClass = list && Object.values(list)[0];
  return anyClass || ["General", `${subject} Basics`];
}
