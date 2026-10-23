/**
 * CodeEditor - C# Code Editor Component
 * Provides syntax highlighting, line numbers, indentation, and event handler generation.
 */
class CodeEditor {
  constructor(ide) {
    this.ide = ide;
    this.textarea = document.getElementById('code-editor-textarea');
    this.highlightEl = document.getElementById('code-highlight-content');
    this.gutter = document.getElementById('code-gutter');
    this.membersSelect = document.getElementById('code-members-select');

    this.designerTextarea = document.getElementById('designer-code-textarea');
    this.designerHighlight = document.getElementById('designer-code-highlight');
    this.designerGutter = document.getElementById('designer-code-gutter');

    this.programTextarea = document.getElementById('program-code-textarea');
    this.programHighlight = document.getElementById('program-code-highlight');
    this.programGutter = document.getElementById('program-code-gutter');

    this.initDefaultProgramCode();
    this.attachEventListeners();
  }

  initDefaultProgramCode() {
    const programCode = `using System;
using System.Windows.Forms;

namespace WindowsFormsApp1
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Form1());
        }
    }
}`;
    if (this.programTextarea) {
      this.programTextarea.value = programCode;
      this.renderProgramCode();
    }
  }

  attachEventListeners() {
    if (!this.textarea) return;

    // Textarea input
    this.textarea.addEventListener('input', () => {
      this.updateHighlighting();
      this.updateGutter();
      this.updateMembersDropdown();
      this.ide.validateCurrentCode();
      this.updateCaretPosition();
    });

    // Synchronize scrolling between textarea and highlight overlay & gutter
    this.textarea.addEventListener('scroll', () => {
      const overlay = document.getElementById('code-highlight-overlay');
      if (overlay) {
        overlay.scrollTop = this.textarea.scrollTop;
        overlay.scrollLeft = this.textarea.scrollLeft;
      }
      if (this.gutter) {
        this.gutter.scrollTop = this.textarea.scrollTop;
      }
    });

    // Caret Tracking
    this.textarea.addEventListener('keyup', () => this.updateCaretPosition());
    this.textarea.addEventListener('click', () => this.updateCaretPosition());

    // Smart Keys: Tab, Enter, Brackets
    this.textarea.addEventListener('keydown', (e) => {
      // Tab key
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        // Insert 4 spaces
        this.textarea.value = val.substring(0, start) + '    ' + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
        this.updateHighlighting();
        this.updateGutter();
        return;
      }

      // Enter key (auto-indent)
      if (e.key === 'Enter') {
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        const currentLine = val.substring(0, start).split('\n').pop();
        const matchIndent = currentLine.match(/^\s*/);
        let indent = matchIndent ? matchIndent[0] : '';

        // If line ends with '{', increase indent
        if (currentLine.trim().endsWith('{')) {
          e.preventDefault();
          const extraIndent = indent + '    ';
          this.textarea.value = val.substring(0, start) + '\n' + extraIndent + '\n' + indent + '}' + val.substring(start);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 1 + extraIndent.length;
          this.updateHighlighting();
          this.updateGutter();
          return;
        } else if (indent.length > 0) {
          e.preventDefault();
          this.textarea.value = val.substring(0, start) + '\n' + indent + val.substring(start);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 1 + indent.length;
          this.updateHighlighting();
          this.updateGutter();
          return;
        }
      }
    });

    // Method jumping via members select
    if (this.membersSelect) {
      this.membersSelect.addEventListener('change', () => {
        const selectedMethod = this.membersSelect.value;
        if (selectedMethod && selectedMethod !== 'all') {
          this.jumpToMethod(selectedMethod);
        }
      });
    }

    // Format Code Button
    const btnFormat = document.getElementById('btn-format-code');
    if (btnFormat) {
      btnFormat.addEventListener('click', () => this.formatCode());
    }

    // Insert Sample Snippet
    const btnSnippet = document.getElementById('btn-insert-sample');
    if (btnSnippet) {
      btnSnippet.addEventListener('click', () => this.insertSampleSnippet());
    }
  }

  setCode(code) {
    if (!this.textarea) return;
    this.textarea.value = code;
    this.updateHighlighting();
    this.updateGutter();
    this.updateMembersDropdown();
  }

  getCode() {
    return this.textarea ? this.textarea.value : '';
  }

  setDesignerCode(code) {
    if (!this.designerTextarea) return;
    this.designerTextarea.value = code;
    if (this.designerHighlight) {
      this.designerHighlight.innerHTML = this.highlightCSharp(code);
    }
    this.updateDesignerGutter(code);
  }

  renderProgramCode() {
    if (!this.programTextarea || !this.programHighlight) return;
    const code = this.programTextarea.value;
    this.programHighlight.innerHTML = this.highlightCSharp(code);
    const lines = code.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lines; i++) {
      gutterHTML += `<div class="gutter-line">${i}</div>`;
    }
    if (this.programGutter) this.programGutter.innerHTML = gutterHTML;
  }

  updateGutter() {
    if (!this.gutter || !this.textarea) return;
    const lines = this.textarea.value.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lines; i++) {
      gutterHTML += `<div class="gutter-line">${i}</div>`;
    }
    this.gutter.innerHTML = gutterHTML;
  }

  updateDesignerGutter(code) {
    if (!this.designerGutter) return;
    const lines = code.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lines; i++) {
      gutterHTML += `<div class="gutter-line">${i}</div>`;
    }
    this.designerGutter.innerHTML = gutterHTML;
  }

  updateCaretPosition() {
    if (!this.textarea) return;
    const text = this.textarea.value.substring(0, this.textarea.selectionStart);
    const lines = text.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;
    const el = document.getElementById('status-caret');
    if (el) el.textContent = `Ln ${lineNum}, Col ${colNum}`;
  }

  updateHighlighting() {
    if (!this.highlightEl || !this.textarea) return;
    this.highlightEl.innerHTML = this.highlightCSharp(this.textarea.value);
  }

  /**
   * C# Syntax Highlighter
   */
  highlightCSharp(code) {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Token regexes
    const keywords = /\b(using|namespace|public|private|protected|internal|class|partial|static|void|int|string|bool|double|float|decimal|var|new|this|return|if|else|while|for|foreach|in|switch|case|break|continue|try|catch|finally|throw|null|true|false)\b/g;
    const types = /\b(Form|EventArgs|Button|TextBox|Label|ComboBox|Timer|CheckBox|ListBox|ProgressBar|PictureBox|MessageBox|Console|Math|Random|Convert|DateTime|String|Int32|Double)\b/g;
    const comments = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
    const strings = /("(?:[^"\\]|\\.)*"|\$"[^"]*")/g;
    const numbers = /\b(\d+(\.\d+)?)\b/g;

    let highlighted = escaped;

    // Mask comments & strings to prevent keyword conflicts
    const stringPool = [];
    const commentPool = [];

    highlighted = highlighted.replace(comments, (match) => {
      commentPool.push(`<span class="cs-comment">${match}</span>`);
      return `___COMMENT_${commentPool.length - 1}___`;
    });

    highlighted = highlighted.replace(strings, (match) => {
      stringPool.push(`<span class="cs-string">${match}</span>`);
      return `___STRING_${stringPool.length - 1}___`;
    });

    // Apply keywords, types, numbers
    highlighted = highlighted.replace(keywords, '<span class="cs-keyword">$1</span>');
    highlighted = highlighted.replace(types, '<span class="cs-type">$1</span>');
    highlighted = highlighted.replace(numbers, '<span class="cs-number">$1</span>');

    // Restore strings and comments
    highlighted = highlighted.replace(/___STRING_(\d+)___/g, (_, id) => stringPool[id]);
    highlighted = highlighted.replace(/___COMMENT_(\d+)___/g, (_, id) => commentPool[id]);

    return highlighted;
  }

  /**
   * Update the member methods dropdown at top of code editor
   */
  updateMembersDropdown() {
    if (!this.membersSelect || !this.textarea) return;
    const code = this.textarea.value;
    const methodMatches = code.matchAll(/(?:public|private|protected)?\s*(?:void|int|string|bool)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g);

    let html = `<option value="all">(Declarations &amp; Methods)</option>`;
    for (const match of methodMatches) {
      const methodName = match[1];
      html += `<option value="${methodName}">${methodName}(...)</option>`;
    }
    this.membersSelect.innerHTML = html;
  }

  /**
   * Jump caret to a specific method
   */
  jumpToMethod(methodName) {
    if (!this.textarea) return;
    const code = this.textarea.value;
    const index = code.indexOf(methodName);
    if (index !== -1) {
      this.textarea.focus();
      this.textarea.selectionStart = index;
      this.textarea.selectionEnd = index + methodName.length;

      // Scroll into view
      const lines = code.substring(0, index).split('\n').length;
      this.textarea.scrollTop = Math.max(0, (lines - 4) * 19.5);
      this.updateCaretPosition();
    }
  }

  /**
   * Jump caret to a specific 1-indexed line number
   */
  jumpToLine(lineNumber) {
    if (!this.textarea) return;
    const lines = this.textarea.value.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) return;

    let charIdx = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      charIdx += lines[i].length + 1; // +1 for newline character
    }

    this.textarea.focus();
    this.textarea.selectionStart = charIdx;
    this.textarea.selectionEnd = charIdx + lines[lineNumber - 1].length;
    this.textarea.scrollTop = Math.max(0, (lineNumber - 5) * 19.5);
    this.updateCaretPosition();
  }

  /**
   * Generate an event handler method in Form1.cs if not already present
   */
  ensureEventHandler(controlName, eventType, signature = '(object sender, EventArgs e)') {
    const handlerName = `${controlName}_${eventType}`;
    let code = this.getCode();

    // Check if method already exists
    if (code.includes(`void ${handlerName}`)) {
      this.ide.switchTab('code');
      this.jumpToMethod(handlerName);
      return;
    }

    // Default template inside handler based on control type
    let defaultBody = `            // TODO: Code for ${controlName}_${eventType}\n`;
    if (eventType === 'Click') {
      defaultBody = `            MessageBox.Show("${controlName} was clicked!", "Information");\n`;
    } else if (eventType === 'Tick') {
      defaultBody = `            // Code here runs every timer interval\n`;
    } else if (eventType === 'SelectedIndexChanged') {
      defaultBody = `            // Code here runs when an item is selected\n`;
    }

    const methodSnippet = `
        private void ${handlerName}${signature}
        {
${defaultBody}        }
`;

    // Insert right before the last closing brace of class Form1
    const lastBraceIndex = code.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      // Find the second to last brace if namespace wraps class
      const secondLastBrace = code.lastIndexOf('}', lastBraceIndex - 1);
      const targetIndex = secondLastBrace !== -1 ? secondLastBrace : lastBraceIndex;

      code = code.substring(0, targetIndex) + methodSnippet + code.substring(targetIndex);
      this.setCode(code);
      this.ide.switchTab('code');
      this.jumpToMethod(handlerName);
      this.ide.logOutput(`Generated event handler '${handlerName}' in Form1.cs.`, 'info');
    }
  }

  /**
   * Auto-format code indentation
   */
  formatCode() {
    if (!this.textarea) return;
    const lines = this.textarea.value.split('\n');
    let indentLevel = 0;
    const formatted = [];

    for (let line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        formatted.push('');
        continue;
      }

      // Closing braces decrease indent before line
      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted.push('    '.repeat(indentLevel) + trimmed);

      // Opening braces increase indent after line
      if (trimmed.endsWith('{')) {
        indentLevel++;
      }
    }

    this.setCode(formatted.join('\n'));
    this.ide.logOutput("C# Code formatted cleanly.", 'info');
  }

  /**
   * Insert common student C# code snippets
   */
  insertSampleSnippet() {
    const snippets = [
      `// Read integer from TextBox:\nint value = int.Parse(textBox1.Text);`,
      `// Show Windows MessageBox:\nMessageBox.Show("Hello World!", "Title");`,
      `// Control ComboBox items:\ncomboBox1.Items.Add("New Item");`,
      `// Control Timer:\ntimer1.Start(); // or timer1.Stop();`
    ];

    const pick = prompt("Choose a snippet to insert:\n1. Read int from TextBox\n2. MessageBox.Show\n3. ComboBox Add\n4. Start Timer", "1");
    if (!pick) return;

    const idx = parseInt(pick, 10) - 1;
    if (snippets[idx]) {
      const start = this.textarea.selectionStart;
      const val = this.textarea.value;
      this.textarea.value = val.substring(0, start) + '\n            ' + snippets[idx] + '\n' + val.substring(start);
      this.updateHighlighting();
      this.updateGutter();
    }
  }
}

window.CodeEditor = CodeEditor;
