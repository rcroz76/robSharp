/**
 * Student WinForms Templates & Starter Projects
 */
const VSTemplates = {
  // 1. Empty Form
  empty: {
    name: "Empty Windows Form",
    form: {
      properties: {
        Text: "Form1",
        Width: 480,
        Height: 360,
        BackColor: "#f0f0f0"
      },
      controls: []
    },
    code: `using System;
using System.Windows.Forms;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // Code here runs as soon as the form starts!
        }
    }
}`
  },

  // 2. Clicker Counter
  counter: {
    name: "Clicker Counter App",
    form: {
      properties: {
        Text: "Clicker Counter",
        Width: 460,
        Height: 320,
        BackColor: "#f5f5f5"
      },
      controls: [
        {
          name: "labelTitle",
          type: "Label",
          x: 40,
          y: 24,
          width: 380,
          height: 30,
          properties: {
            Text: "Student Clicker Counter",
            FontSize: 14,
            ForeColor: "#0078d7"
          }
        },
        {
          name: "labelCount",
          type: "Label",
          x: 40,
          y: 64,
          width: 380,
          height: 48,
          properties: {
            Text: "Clicks: 0",
            FontSize: 20,
            ForeColor: "#202020"
          }
        },
        {
          name: "labelStep",
          type: "Label",
          x: 40,
          y: 128,
          width: 80,
          height: 24,
          properties: {
            Text: "Step size:"
          }
        },
        {
          name: "textBoxStep",
          type: "TextBox",
          x: 120,
          y: 126,
          width: 80,
          height: 24,
          properties: {
            Text: "1"
          }
        },
        {
          name: "buttonAdd",
          type: "Button",
          x: 40,
          y: 170,
          width: 120,
          height: 40,
          properties: {
            Text: "Click Me! (+)"
          }
        },
        {
          name: "buttonReset",
          type: "Button",
          x: 180,
          y: 170,
          width: 120,
          height: 40,
          properties: {
            Text: "Reset Count"
          }
        }
      ]
    },
    code: `using System;
using System.Windows.Forms;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        // Class-level state variable
        int count = 0;

        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            Console.WriteLine("Clicker App Loaded. Ready for clicks!");
        }

        private void buttonAdd_Click(object sender, EventArgs e)
        {
            // Read step size from the textbox
            int step = int.Parse(textBoxStep.Text);
            count = count + step;

            // Update the label text
            labelCount.Text = "Clicks: " + count;

            // Show a celebratory message if we reach 10 clicks
            if (count >= 10 && count - step < 10)
            {
                MessageBox.Show("Milestone achieved! You reached 10 or more clicks!", "Achievement Unlocked");
            }
        }

        private void buttonReset_Click(object sender, EventArgs e)
        {
            count = 0;
            labelCount.Text = "Clicks: 0";
            Console.WriteLine("Counter was reset to 0.");
        }
    }
}`
  },

  // 3. Stopwatch & Timer (Features Timer, Button, Label, ComboBox)
  stopwatch: {
    name: "Stopwatch & Timer App",
    form: {
      properties: {
        Text: "Digital Stopwatch & Timer",
        Width: 480,
        Height: 340,
        BackColor: "#f0f2f5"
      },
      controls: [
        {
          name: "timer1",
          type: "Timer",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          properties: {
            Interval: 1000,
            Enabled: false
          }
        },
        {
          name: "labelDisplay",
          type: "Label",
          x: 40,
          y: 30,
          width: 400,
          height: 60,
          properties: {
            Text: "00:00",
            FontSize: 32,
            ForeColor: "#0078d7"
          }
        },
        {
          name: "buttonStart",
          type: "Button",
          x: 40,
          y: 110,
          width: 100,
          height: 36,
          properties: {
            Text: "▶ Start"
          }
        },
        {
          name: "buttonStop",
          type: "Button",
          x: 150,
          y: 110,
          width: 100,
          height: 36,
          properties: {
            Text: "⏹ Stop"
          }
        },
        {
          name: "buttonReset",
          type: "Button",
          x: 260,
          y: 110,
          width: 100,
          height: 36,
          properties: {
            Text: "↺ Reset"
          }
        },
        {
          name: "labelSpeed",
          type: "Label",
          x: 40,
          y: 175,
          width: 120,
          height: 24,
          properties: {
            Text: "Timer Speed:"
          }
        },
        {
          name: "comboBoxSpeed",
          type: "ComboBox",
          x: 160,
          y: 172,
          width: 180,
          height: 26,
          properties: {
            Items: [
              "1000 ms (1 second)",
              "500 ms (Half second)",
              "250 ms (Fast)",
              "100 ms (Turbo)"
            ],
            Text: "1000 ms (1 second)"
          }
        },
        {
          name: "labelStatus",
          type: "Label",
          x: 40,
          y: 220,
          width: 380,
          height: 24,
          properties: {
            Text: "Status: Stopped",
            ForeColor: "#555555"
          }
        }
      ]
    },
    code: `using System;
using System.Windows.Forms;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        int totalSeconds = 0;

        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            timer1.Interval = 1000;
            Console.WriteLine("Stopwatch ready. Default interval is 1000ms.");
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            // Fires every timer interval
            totalSeconds++;

            int mins = totalSeconds / 60;
            int secs = totalSeconds % 60;

            string strMins = mins.ToString();
            string strSecs = secs.ToString();

            if (mins < 10) strMins = "0" + strMins;
            if (secs < 10) strSecs = "0" + strSecs;

            labelDisplay.Text = strMins + ":" + strSecs;
        }

        private void buttonStart_Click(object sender, EventArgs e)
        {
            timer1.Start();
            labelStatus.Text = "Status: Running...";
            Console.WriteLine("Timer started.");
        }

        private void buttonStop_Click(object sender, EventArgs e)
        {
            timer1.Stop();
            labelStatus.Text = "Status: Paused";
            Console.WriteLine("Timer stopped at: " + labelDisplay.Text);
        }

        private void buttonReset_Click(object sender, EventArgs e)
        {
            timer1.Stop();
            totalSeconds = 0;
            labelDisplay.Text = "00:00";
            labelStatus.Text = "Status: Reset to zero";
        }

        private void comboBoxSpeed_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (comboBoxSpeed.SelectedItem == "100 ms (Turbo)")
            {
                timer1.Interval = 100;
            }
            else if (comboBoxSpeed.SelectedItem == "250 ms (Fast)")
            {
                timer1.Interval = 250;
            }
            else if (comboBoxSpeed.SelectedItem == "500 ms (Half second)")
            {
                timer1.Interval = 500;
            }
            else
            {
                timer1.Interval = 1000;
            }
            Console.WriteLine("Interval changed to: " + timer1.Interval + " ms");
        }
    }
}`
  },

  // 4. Currency / Unit Converter
  converter: {
    name: "Currency & Unit Converter",
    form: {
      properties: {
        Text: "Currency Converter",
        Width: 480,
        Height: 340,
        BackColor: "#ffffff"
      },
      controls: [
        {
          name: "labelHeader",
          type: "Label",
          x: 30,
          y: 20,
          width: 400,
          height: 26,
          properties: {
            Text: "Currency Converter (USD / EUR / GBP / JPY)",
            FontSize: 12,
            ForeColor: "#0078d7"
          }
        },
        {
          name: "labelAmount",
          type: "Label",
          x: 30,
          y: 65,
          width: 100,
          height: 24,
          properties: {
            Text: "Amount:"
          }
        },
        {
          name: "textBoxAmount",
          type: "TextBox",
          x: 140,
          y: 62,
          width: 120,
          height: 26,
          properties: {
            Text: "100"
          }
        },
        {
          name: "labelFrom",
          type: "Label",
          x: 30,
          y: 110,
          width: 100,
          height: 24,
          properties: {
            Text: "From Currency:"
          }
        },
        {
          name: "comboBoxFrom",
          type: "ComboBox",
          x: 140,
          y: 108,
          width: 160,
          height: 26,
          properties: {
            Items: ["USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"],
            Text: "USD ($)"
          }
        },
        {
          name: "labelTo",
          type: "Label",
          x: 30,
          y: 155,
          width: 100,
          height: 24,
          properties: {
            Text: "To Currency:"
          }
        },
        {
          name: "comboBoxTo",
          type: "ComboBox",
          x: 140,
          y: 152,
          width: 160,
          height: 26,
          properties: {
            Items: ["USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"],
            Text: "GBP (£)"
          }
        },
        {
          name: "buttonConvert",
          type: "Button",
          x: 140,
          y: 195,
          width: 140,
          height: 36,
          properties: {
            Text: "Convert Value"
          }
        },
        {
          name: "labelResult",
          type: "Label",
          x: 30,
          y: 250,
          width: 420,
          height: 36,
          properties: {
            Text: "Result: Enter amount and click Convert",
            FontSize: 13,
            ForeColor: "#107c10"
          }
        }
      ]
    },
    code: `using System;
using System.Windows.Forms;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            Console.WriteLine("Currency Converter Loaded.");
        }

        private void buttonConvert_Click(object sender, EventArgs e)
        {
            double amount = double.Parse(textBoxAmount.Text);
            string from = comboBoxFrom.SelectedItem;
            string to = comboBoxTo.SelectedItem;

            // Normalize amount to USD base
            double usdAmount = amount;
            if (from == "EUR (€)") usdAmount = amount * 1.08;
            if (from == "GBP (£)") usdAmount = amount * 1.28;
            if (from == "JPY (¥)") usdAmount = amount * 0.0065;

            // Convert from USD to target currency
            double finalAmount = usdAmount;
            string symbol = "$";

            if (to == "EUR (€)")
            {
                finalAmount = usdAmount * 0.92;
                symbol = "€";
            }
            else if (to == "GBP (£)")
            {
                finalAmount = usdAmount * 0.78;
                symbol = "£";
            }
            else if (to == "JPY (¥)")
            {
                finalAmount = usdAmount * 153.5;
                symbol = "¥";
            }

            double rounded = Math.Round(finalAmount * 100) / 100;
            labelResult.Text = "Result: " + symbol + " " + rounded.ToString();
            Console.WriteLine("Converted " + amount + " " + from + " to " + rounded + " " + to);
        }
    }
}`
  },

  // 5. Grade Calculator
  grades: {
    name: "Student Grade Calculator",
    form: {
      properties: {
        Text: "Student Mark & Grade Calculator",
        Width: 460,
        Height: 330,
        BackColor: "#f4f6f9"
      },
      controls: [
        {
          name: "labelScorePrompt",
          type: "Label",
          x: 30,
          y: 30,
          width: 140,
          height: 24,
          properties: {
            Text: "Exam Score (0-100):"
          }
        },
        {
          name: "textBoxScore",
          type: "TextBox",
          x: 180,
          y: 28,
          width: 90,
          height: 24,
          properties: {
            Text: "78"
          }
        },
        {
          name: "labelSubject",
          type: "Label",
          x: 30,
          y: 75,
          width: 140,
          height: 24,
          properties: {
            Text: "Select Subject:"
          }
        },
        {
          name: "comboBoxSubject",
          type: "ComboBox",
          x: 180,
          y: 72,
          width: 220,
          height: 26,
          properties: {
            Items: [
              "Computer Science (BTEC)",
              "Software Development",
              "Mathematics for Computing",
              "Web & Mobile Applications"
            ],
            Text: "Computer Science (BTEC)"
          }
        },
        {
          name: "buttonCalculate",
          type: "Button",
          x: 180,
          y: 120,
          width: 150,
          height: 36,
          properties: {
            Text: "Calculate Grade"
          }
        },
        {
          name: "labelGrade",
          type: "Label",
          x: 30,
          y: 180,
          width: 370,
          height: 40,
          properties: {
            Text: "Grade: Pending",
            FontSize: 16,
            ForeColor: "#0078d7"
          }
        },
        {
          name: "labelFeedback",
          type: "Label",
          x: 30,
          y: 230,
          width: 370,
          height: 50,
          properties: {
            Text: "Enter a score and calculate.",
            ForeColor: "#444444"
          }
        }
      ]
    },
    code: `using System;
using System.Windows.Forms;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            Console.WriteLine("Grade Calculator initialized.");
        }

        private void buttonCalculate_Click(object sender, EventArgs e)
        {
            int score = int.Parse(textBoxScore.Text);
            string subject = comboBoxSubject.SelectedItem;

            if (score < 0 || score > 100)
            {
                MessageBox.Show("Please enter a valid score between 0 and 100.", "Invalid Score");
                return;
            }

            string grade = "Fail";
            string comment = "Keep practicing and revise topics.";

            if (score >= 80)
            {
                grade = "Distinction (*D)";
                comment = "Outstanding performance in " + subject + "!";
            }
            else if (score >= 65)
            {
                grade = "Merit (M)";
                comment = "Good work! Solid understanding shown.";
            }
            else if (score >= 50)
            {
                grade = "Pass (P)";
                comment = "You achieved the pass criteria.";
            }

            labelGrade.Text = "Grade: " + grade;
            labelFeedback.Text = comment;
            Console.WriteLine("Subject: " + subject + " -> Score: " + score + " -> " + grade);
        }
    }
}`
  }
};

window.VSTemplates = VSTemplates;
