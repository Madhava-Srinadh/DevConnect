const mongoose = require("mongoose");
const User = require("./models/user"); // ⚠️ Check path to your User model
const bcrypt = require("bcrypt");

// ⚠️ REPLACE WITH YOUR MONGO URI
const MONGO_URI =
  "mongodb+srv://madhavasrinadh:Srinadh1699@mongo-cluster.or7d0.mongodb.net/DevConnect";

const usersData = [
  {
    firstName: "Aarav",
    lastName: "Patel",
    gender: "male",
    about: "Full Stack Developer exploring the MERN stack.",
  },
  {
    firstName: "Vivaan",
    lastName: "Sharma",
    gender: "male",
    about: "AI enthusiast and Python lover.",
  },
  {
    firstName: "Aditya",
    lastName: "Verma",
    gender: "male",
    about: "Backend engineer focused on scalable systems.",
  },
  {
    firstName: "Vihaan",
    lastName: "Singh",
    gender: "male",
    about: "Frontend wizard. React & Tailwind expert.",
  },
  {
    firstName: "Arjun",
    lastName: "Kumar",
    gender: "male",
    about: "DevOps engineer. Automating everything.",
  },
  {
    firstName: "Sai",
    lastName: "Reddy",
    gender: "male",
    about: "Data Scientist. Love crunching numbers.",
  },
  {
    firstName: "Reyansh",
    lastName: "Gupta",
    gender: "male",
    about: "Mobile App Developer (Flutter & React Native).",
  },
  {
    firstName: "Ayan",
    lastName: "Mehta",
    gender: "male",
    about: "Cloud Architect. AWS Certified.",
  },
  {
    firstName: "Krishna",
    lastName: "Iyer",
    gender: "male",
    about: "Blockchain developer. Web3 is the future.",
  },
  {
    firstName: "Ishaan",
    lastName: "Nair",
    gender: "male",
    about: "Cybersecurity analyst. keeping things safe.",
  },
  {
    firstName: "Shaurya",
    lastName: "Joshi",
    gender: "male",
    about: "Game Developer using Unity and C#.",
  },
  {
    firstName: "Atharva",
    lastName: "Desai",
    gender: "male",
    about: "Embedded Systems Engineer. IoT lover.",
  },
  {
    firstName: "Dhruv",
    lastName: "Malhotra",
    gender: "male",
    about: "Product Manager with a coding background.",
  },
  {
    firstName: "Kabir",
    lastName: "Bhatia",
    gender: "male",
    about: "Open source contributor and JS fan.",
  },
  {
    firstName: "Rohan",
    lastName: "Saxena",
    gender: "male",
    about: "UI/UX Designer who codes.",
  },
  {
    firstName: "Aarush",
    lastName: "Tiwari",
    gender: "male",
    about: "Tech blogger and software engineer.",
  },
  {
    firstName: "Ansh",
    lastName: "Chopra",
    gender: "male",
    about: "Machine Learning Engineer.",
  },
  {
    firstName: "Rudra",
    lastName: "Pandey",
    gender: "male",
    about: "Database Administrator. SQL & NoSQL.",
  },
  {
    firstName: "Aryan",
    lastName: "Garg",
    gender: "male",
    about: "Network Engineer.",
  },
  {
    firstName: "Dev",
    lastName: "Mishra",
    gender: "male",
    about: "System Analyst.",
  },
  {
    firstName: "Rakshit",
    lastName: "Shetty",
    gender: "male",
    about: "Looking for new opportunities in Tech.",
  },
  {
    firstName: "Varun",
    lastName: "Dhawan",
    gender: "male",
    about: "Passionate about clean code and architecture.",
  },
  {
    firstName: "Siddharth",
    lastName: "Malhotra",
    gender: "male",
    about: "Java Developer with 5 years experience.",
  },
  {
    firstName: "Kartik",
    lastName: "Aryan",
    gender: "male",
    about: "React Native developer.",
  },
  {
    firstName: "Ranbir",
    lastName: "Kapoor",
    gender: "male",
    about: "Software Engineer at a top startup.",
  },

  // Females
  {
    firstName: "Diya",
    lastName: "Patel",
    gender: "female",
    about: "Frontend Developer. CSS is my superpower.",
  },
  {
    firstName: "Saanvi",
    lastName: "Sharma",
    gender: "female",
    about: "Data Analyst. Telling stories with data.",
  },
  {
    firstName: "Ananya",
    lastName: "Verma",
    gender: "female",
    about: "QA Engineer. Breaking code is my job.",
  },
  {
    firstName: "Aadhya",
    lastName: "Singh",
    gender: "female",
    about: "Product Designer. User-centric design.",
  },
  {
    firstName: "Pari",
    lastName: "Kumar",
    gender: "female",
    about: "Technical Writer and Developer.",
  },
  {
    firstName: "Kiara",
    lastName: "Reddy",
    gender: "female",
    about: "Android Developer (Kotlin).",
  },
  {
    firstName: "Myra",
    lastName: "Gupta",
    gender: "female",
    about: "iOS Developer (Swift).",
  },
  {
    firstName: "Riya",
    lastName: "Mehta",
    gender: "female",
    about: "Full Stack Developer (MEAN Stack).",
  },
  {
    firstName: "Saanvi",
    lastName: "Iyer",
    gender: "female",
    about: "Cloud Engineer (Azure).",
  },
  {
    firstName: "Sarah",
    lastName: "Nair",
    gender: "female",
    about: "Software Architect.",
  },
  {
    firstName: "Prisha",
    lastName: "Joshi",
    gender: "female",
    about: "Ethical Hacker.",
  },
  {
    firstName: "Anika",
    lastName: "Desai",
    gender: "female",
    about: "Scrum Master and Agile Coach.",
  },
  {
    firstName: "Navya",
    lastName: "Malhotra",
    gender: "female",
    about: "Ruby on Rails Developer.",
  },
  {
    firstName: "Vani",
    lastName: "Bhatia",
    gender: "female",
    about: "Go Language enthusiast.",
  },
  {
    firstName: "Avni",
    lastName: "Saxena",
    gender: "female",
    about: "Rust Developer. Performance matters.",
  },
  {
    firstName: "Amaira",
    lastName: "Tiwari",
    gender: "female",
    about: "PHP Developer (Laravel).",
  },
  {
    firstName: "Jiya",
    lastName: "Chopra",
    gender: "female",
    about: "WordPress Expert.",
  },
  {
    firstName: "Kyra",
    lastName: "Pandey",
    gender: "female",
    about: "E-commerce specialist (Shopify).",
  },
  {
    firstName: "Sia",
    lastName: "Garg",
    gender: "female",
    about: "Big Data Engineer.",
  },
  {
    firstName: "Ira",
    lastName: "Mishra",
    gender: "female",
    about: "Blockchain enthusiast.",
  },
  {
    firstName: "Alia",
    lastName: "Bhatt",
    gender: "female",
    about: "Digital Marketer and Coder.",
  },
  {
    firstName: "Deepika",
    lastName: "Padukone",
    gender: "female",
    about: "Senior Software Engineer.",
  },
  {
    firstName: "Priyanka",
    lastName: "Chopra",
    gender: "female",
    about: "Tech Lead at a MNC.",
  },
  {
    firstName: "Katrina",
    lastName: "Kaif",
    gender: "female",
    about: "Frontend Architect.",
  },
  {
    firstName: "Kareena",
    lastName: "Kapoor",
    gender: "female",
    about: "UX Researcher.",
  },
];

const SKILLS_POOL = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "React",
  "Node.js",
  "MongoDB",
  "SQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Git",
  "Machine Learning",
  "AI",
  "Data Science",
  "HTML",
  "CSS",
  "Tailwind",
  "Next.js",
  "TypeScript",
  "Go",
  "Rust",
  "Flutter",
];

const getRandomSkills = () => {
  const numSkills = Math.floor(Math.random() * 5) + 2; // 2 to 6 skills
  const shuffled = SKILLS_POOL.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numSkills);
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Optional: Clear existing users
    // await User.deleteMany({});
    // console.log("🗑️ Cleared existing users");

    const usersToInsert = [];

    console.log("⏳ Hashing passwords and generating users...");

    for (let i = 0; i < usersData.length; i++) {
      const user = usersData[i];

      // 1. Generate Password: FirstName@123
      const rawPassword = `${user.firstName}@123`;
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      // 2. Generate Photo URL (using randomuser.me logic)
      // gender: "men" or "women" for the URL
      const urlGender = user.gender === "male" ? "men" : "women";
      // We use 'i' to get unique images (0-99 are valid IDs in randomuser)
      const photoUrl = `https://randomuser.me/api/portraits/${urlGender}/${i + 1}.jpg`;

      // 3. Randomize Profile Status
      const status = Math.random() > 0.3 ? "public" : "private"; // 70% public, 30% private

      usersToInsert.push({
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@example.com`,
        password: passwordHash,
        gender: user.gender,
        age: Math.floor(Math.random() * 15) + 20, // Age 20-35
        about: user.about,
        skills: getRandomSkills(),
        profileStatus: status,
        photoUrl: photoUrl,
      });
    }

    await User.insertMany(usersToInsert);
    console.log(`🚀 Successfully added ${usersToInsert.length} users!`);

    console.log("ℹ️ Login Example: ");
    console.log(`   Email: ${usersToInsert[0].emailId}`);
    console.log(`   Password: ${usersData[0].firstName}@123`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

seedDatabase();
