# Rob# - C# Windows Forms Simulator & IDE

An authentic web-based **C# Windows Forms IDE** (Rob#) modeled directly on Microsoft Visual Studio. Built for computing students and educators learning C# desktop application development with pure HTML5, CSS3, and modern JavaScript.

---

## 🚀 Key Features

### 1. Visual Studio Look & Feel
- **Theme Support:** Dark Theme (VS 2022 default) and Light Theme with one-click toggling.
- **Classic VS Chrome:** Top Title Bar, Menu Bar, Standard Toolbar, Docking Layout, Document Well, Status Bar.
- **Output & Error List:** Real-time compilation checks, error code reporting (`CS1022`, `CS1513`, etc.) with clickable line numbers, and live `Console.WriteLine` streaming.

### 2. Form Designer Canvas
- **Authentic Windows Form Window:** Title bar with icon, system buttons (─, □, ✕), client area with **8px snap-to-grid dots**, and bottom-right resize handle.
- **Interactive Control Manipulation:**
  - Drag-and-drop controls directly from the **Toolbox**.
  - Move controls with grid snapping.
  - Resize controls using **8 corner and edge handles**.
  - Delete controls using the `Delete` key, toolbar button, or Edit menu.
- **Component Tray (for Non-Visual Components):**
  - Just like real Visual Studio, non-visual components like **Timers** appear in the dedicated **Component Tray** below the form (`⏱ timer1 [Timer]`).
- **Code Synchronization:**
  - Inspect **`Form1.Designer.cs`** at any time to see the exact C# code auto-generated for control declarations, `InitializeComponent()`, locations, sizes, and event wiring!

### 3. Supported Controls
Students can add and configure all requested controls:
- **Button (`Button`):** Clickable button raising `button1_Click`.
- **TextBox (`TextBox`):** Editable text field accessible via `textBox1.Text`.
- **Label (`Label`):** Text display for status, counters, and results via `label1.Text`.
- **Timer (`Timer`):** Configurable `Interval` (ms) raising periodic `timer1_Tick` events with `.Start()` and `.Stop()`.
- **ComboBox (`ComboBox`):** Dropdown list with interactive String Collection Editor dialog, items collection (`comboBox1.Items.Add()`), and `SelectedIndexChanged` events.
- **Bonus Controls:** CheckBox, ListBox, ProgressBar, PictureBox.

### 4. Properties Window (F4)
- **Categorized & Alphabetical Views:** Appearance, Behavior, Design, Layout, and Data.
- **Real-Time Property Editing:** `(Name)`, `Text`, `BackColor`, `ForeColor`, `Location`, `Size`, `Interval`, `Enabled`, `Visible`.
- **Collection Editor:** Dedicated dialog for editing ComboBox items one per line.
- **Events Mode (⚡):** Quick list of available events for any control (`Click`, `TextChanged`, `SelectedIndexChanged`, `Tick`, `Load`).
- **Contextual Help Box:** Explanations and documentation for each selected property.

### 5. C# Code Editor & Live Execution Engine
- **Tabs:** `Form1.cs [Design]`, `Form1.cs` (code-behind), `Form1.Designer.cs` (read-only generated code), `Program.cs`.
- **Syntax Highlighting:** Keywords (blue), types (teal), methods (yellow), strings (orange), numbers (light green), and comments (green).
- **Auto-Indentation & Smart Tab:** 4 spaces on Tab, automatic brace matching and indent on Enter.
- **Double-Click Event Generation:** Double-clicking any control in the designer auto-generates the corresponding C# event handler in `Form1.cs` and navigates right to it!
- **C# Syntax Validation & Semicolon Checking:**
  - Enforces C# grammar: statements must end with a semicolon `;`.
  - Automatically flags missing semicolons with **`CS1002: ; expected`** in the **Error List** tab with clickable line numbers.
- **Strict Identifier & Control Validation (`CS0103`):**
  - Enforces C# case-sensitivity: referring to a control with incorrect casing (e.g. typing `textbox1` when the control is `textBox1`) raises **`CS0103: The name 'textbox1' does not exist in the current context. Did you mean 'textBox1'? In C#, identifiers are case-sensitive.`**.
  - Flags non-existent objects and variables (e.g. `textBox99.Text`) with **`CS0103: The name 'textBox99' does not exist in the current context (no control or variable named 'textBox99' was found).`**.
  - Immediately halts the build and blocks execution from running until corrected, exactly like real Microsoft Visual Studio!
- **Strict Relational Operator & Type Checking (`CS0019`):**
  - Enforces C# strong typing: relational operators (`<`, `>`, `<=`, `>=`) **cannot** be applied to strings!
  - If a student writes `string age; if (age > 45)` or `if (textBox1.Text > 45)` without parsing to a number, the compiler flags **`CS0019: Operator '>' cannot be applied to operands of type 'string' and 'int' (strings cannot be compared using relational operators; convert to int or double first).`**.
  - Comparing a string to a numeric type with `==` (e.g. `age == 45`) is also flagged with **`CS0019`**.
  - Numeric types (`int`, `double`, `float`) properly support relational operators (e.g. `int age = int.Parse(textBox1.Text); if (age > 45)`), while string-to-string equality (`if (name == "Alice")`) is fully supported.
- **PascalCase `.Text` Property Enforcement (`CS1061`):**
  - Pure C# Windows Forms syntax: access and set text strictly with PascalCase `.Text` (e.g. `label1.Text = "Hello";`, `textBox1.Text`). Lowercase `.text` is disallowed and flagged with **`CS1061: Did you mean 'Text'?`**.
- **Interactive Debugger (▶ Start / F5):**
  - Runs the student's C# code in an authentic floating Windows Form window.
  - Interactive buttons, text inputs, dropdown selections, live timer ticks, and Windows `MessageBox.Show()`.
  - Full support for `int.Parse()`, `double.Parse()`, `Convert.ToInt32()`, `.ToString()`, math arithmetic, if/else, loops, and string interpolation `$"..."`.

### 6. Educational Starter Templates
Includes pre-built interactive examples ready to run:
1. **Empty Windows Form:** Clean starter template.
2. **Clicker Counter App:** Uses `Button`, `TextBox`, and `Label` with milestone message boxes.
3. **Digital Stopwatch & Timer:** Demonstrates `Timer`, `Button`, `Label`, and `ComboBox` for speed control.
4. **Currency / Unit Converter:** Demonstrates `TextBox`, `ComboBox`, `Label`, and `Button` with real conversion math.
5. **Student Grade Calculator:** Exam marks calculation with boundary comments and feedback.

### 6. Saving & Submission
- **Local Storage:** Automatically saves progress in the browser.
- **Export to JSON:** Students can download their project file (`.json`) to submit homework or share with teachers.
- **Export C# Code:** Export `Form1.cs` to import directly into real Microsoft Visual Studio on desktop.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`F5`** | Start Debugging (Run Form Application) |
| **`Shift + F5`** | Stop Debugging |
| **`F7`** | View Code (`Form1.cs`) |
| **`Shift + F7`** | View Form Designer |
| **`Ctrl + S`** | Save Project to Local Storage |
| **`Ctrl + Shift + B`** | Build Solution / Validate Code |
| **`Delete`** | Delete Selected Control |

---

## 📂 Project Structure

```
├── index.html           # Main Visual Studio IDE application shell
├── styles.css           # VS 2022 Dark/Light styling, designer canvas, control themes
├── js/
│   ├── app.js           # Main IDE controller, menus, toolbars, properties grid
│   ├── csharp-engine.js # C# parser, validator, transpiler, and runtime sandbox
│   ├── designer.js      # Visual form canvas, drag-and-drop, resize, component tray
│   ├── code-editor.js   # Syntax highlighter, line numbers, event handler generator
│   └── templates.js     # Starter templates (Stopwatch, Counter, Converter, etc.)
└── README.md            # Documentation and student guide
```

---

## 🌐 How to Run
Simply open **`index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari). No installation, servers, or external dependencies are required. Runs completely offline.
