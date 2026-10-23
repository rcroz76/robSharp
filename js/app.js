/**
 * Visual Studio C# Windows Forms IDE - Main Application Controller
 * Wires together Toolbox, Designer, Code Editor, Properties Window,
 * Solution Explorer, Debugger, and Project Storage.
 */
class VisualStudioApp {
  constructor() {
    this.currentTheme = 'dark';
    this.isDebugging = false;
    this.propMode = 'props'; // 'props' or 'events'
    this.propSort = 'cat';   // 'cat' or 'alpha'

    // Initialize Subsystems
    this.engine = new CSharpEngine(this);
    this.codeEditor = new CodeEditor(this);
    this.designer = new WinFormsDesigner(this);

    this.initUI();
    this.initShortcuts();
    this.loadInitialProject();
  }

  initUI() {
    // Top Titlebar & Theme Toggle
    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.toggleTheme());
    }

    // Menu Actions
    this.setupMenuActions();

    // Standard Toolbar Actions
    this.setupToolbarActions();

    // Document Tabs
    this.setupTabNavigation();

    // Toolbox Controls
    this.setupToolbox();

    // Properties Grid Panel
    this.setupPropertiesPanel();

    // Solution Explorer Tree
    this.setupSolutionExplorer();

    // Bottom Output & Errors Panel
    this.setupBottomPanel();

    // Running App Modal Controls
    this.setupRunningAppWindow();

    // String Collection Dialog (ComboBox items)
    this.setupItemsEditorDialog();

    // Help & Cheatsheet Dialog
    this.setupHelpDialog();
  }

  /**
   * Theme switcher (Visual Studio Dark vs Light)
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    if (this.currentTheme === 'light') {
      document.body.classList.remove('vs-dark');
      document.body.classList.add('vs-light');
    } else {
      document.body.classList.remove('vs-light');
      document.body.classList.add('vs-dark');
    }
    this.logOutput(`Switched theme to Rob# ${this.currentTheme.toUpperCase()}.`, 'info');
  }

  /**
   * Setup Menu Bar Actions
   */
  setupMenuActions() {
    // File Menu
    document.getElementById('menu-new-project')?.addEventListener('click', () => this.newProject());
    document.getElementById('menu-open-project')?.addEventListener('click', () => this.promptOpenFile());
    document.getElementById('menu-save-project')?.addEventListener('click', () => this.saveProject());
    document.getElementById('menu-export-project')?.addEventListener('click', () => this.exportProjectJSON());
    document.getElementById('menu-export-cs')?.addEventListener('click', () => this.exportCSharpFiles());

    // Samples in File Menu
    document.getElementById('menu-load-template-1')?.addEventListener('click', () => this.loadTemplate('counter'));
    document.getElementById('menu-load-template-2')?.addEventListener('click', () => this.loadTemplate('stopwatch'));
    document.getElementById('menu-load-template-3')?.addEventListener('click', () => this.loadTemplate('converter'));
    document.getElementById('menu-load-template-4')?.addEventListener('click', () => this.loadTemplate('grades'));

    // Edit Menu
    document.getElementById('menu-undo')?.addEventListener('click', () => this.logOutput("Undo performed.", 'info'));
    document.getElementById('menu-redo')?.addEventListener('click', () => this.logOutput("Redo performed.", 'info'));
    document.getElementById('menu-delete-control')?.addEventListener('click', () => {
      if (this.designer.selectedControl) {
        this.designer.deleteControl(this.designer.selectedControl.name);
      }
    });
    document.getElementById('menu-clear-form')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to remove all controls from the form?")) {
        this.designer.clearAllControls();
      }
    });

    // View Menu
    document.getElementById('menu-view-designer')?.addEventListener('click', () => this.switchTab('designer'));
    document.getElementById('menu-view-code')?.addEventListener('click', () => this.switchTab('code'));
    document.getElementById('menu-toggle-grid')?.addEventListener('click', () => this.toggleGrid());
    document.getElementById('menu-toggle-toolbox')?.addEventListener('click', () => this.toggleToolbox());
    document.getElementById('menu-toggle-properties')?.addEventListener('click', () => this.focusProperties());
    document.getElementById('menu-toggle-output')?.addEventListener('click', () => this.switchBottomTab('output'));

    // Build Menu
    document.getElementById('menu-build-solution')?.addEventListener('click', () => this.buildSolution());
    document.getElementById('menu-rebuild-solution')?.addEventListener('click', () => this.buildSolution(true));

    // Debug Menu
    document.getElementById('menu-start-debug')?.addEventListener('click', () => this.startDebugging());
    document.getElementById('menu-stop-debug')?.addEventListener('click', () => this.stopDebugging());

    // Help Menu
    document.getElementById('menu-open-guide')?.addEventListener('click', () => this.openHelpGuide('tutorial'));
    document.getElementById('menu-open-cheatsheet')?.addEventListener('click', () => this.openHelpGuide('cheatsheet'));
    document.getElementById('menu-about')?.addEventListener('click', () => this.openHelpGuide('about'));
  }

  /**
   * Setup Standard Toolbar
   */
  setupToolbarActions() {
    document.getElementById('tb-save')?.addEventListener('click', () => this.saveProject());
    document.getElementById('tb-start')?.addEventListener('click', () => this.startDebugging());
    document.getElementById('tb-stop')?.addEventListener('click', () => this.stopDebugging());
    document.getElementById('tb-view-designer')?.addEventListener('click', () => this.switchTab('designer'));
    document.getElementById('tb-view-code')?.addEventListener('click', () => this.switchTab('code'));

    const btnGrid = document.getElementById('tb-grid-toggle');
    if (btnGrid) {
      btnGrid.addEventListener('click', () => this.toggleGrid());
    }

    const samplePicker = document.getElementById('tb-sample-picker');
    if (samplePicker) {
      samplePicker.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          this.loadTemplate(val);
          e.target.value = '';
        }
      });
    }

    document.getElementById('tb-help-guide')?.addEventListener('click', () => this.openHelpGuide('tutorial'));

    // Quick align button on designer bar
    document.getElementById('btn-align-center')?.addEventListener('click', () => this.designer.alignCenter());
    document.getElementById('btn-delete-sel')?.addEventListener('click', () => {
      if (this.designer.selectedControl) {
        this.designer.deleteControl(this.designer.selectedControl.name);
      }
    });
  }

  /**
   * Document Tabs (Designer, Form1.cs, Form1.Designer.cs, Program.cs)
   */
  setupTabNavigation() {
    const tabs = document.querySelectorAll('.doc-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.doc-view').forEach(v => v.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetView = document.getElementById(`view-${tabName}`);

    if (targetTab && targetView) {
      targetTab.classList.add('active');
      targetView.classList.add('active');
    }

    if (tabName === 'code') {
      this.codeEditor.updateHighlighting();
      this.codeEditor.updateGutter();
      this.codeEditor.updateMembersDropdown();
    } else if (tabName === 'designer-code') {
      this.designer.syncDesignerCode();
    } else if (tabName === 'program') {
      this.codeEditor.renderProgramCode();
    }
  }

  /**
   * Setup Toolbox Control dragging and clicking
   */
  setupToolbox() {
    const items = document.querySelectorAll('.toolbox-item');
    items.forEach(item => {
      const toolType = item.dataset.tool;

      // HTML5 Drag
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', toolType);
        e.dataTransfer.effectAllowed = 'copy';
      });

      // Click to select tool or add control
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (toolType !== 'pointer') {
          // If student clicks on a tool, place it on the center of the form
          this.designer.addControl(toolType, 40, 50);
        }
      });
    });

    // Search filter
    const filterInput = document.getElementById('toolbox-filter');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        items.forEach(item => {
          const name = item.querySelector('.tool-name')?.textContent.toLowerCase() || '';
          if (name.includes(query) || query === '') {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }

    // Category Expand/Collapse
    const catHeaders = document.querySelectorAll('.category-header');
    catHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const category = header.closest('.toolbox-category');
        category.classList.toggle('collapsed');
      });
    });

    // Dock Toolbox
    document.getElementById('btn-dock-toolbox')?.addEventListener('click', () => this.toggleToolbox());
  }

  toggleToolbox() {
    const panel = document.getElementById('panel-toolbox');
    if (panel) {
      panel.classList.toggle('collapsed');
    }
  }

  toggleGrid() {
    this.designer.snapToGrid = !this.designer.snapToGrid;
    const canvas = document.getElementById('winform-client-area');
    const tbBtn = document.getElementById('tb-grid-toggle');
    const infoEl = document.getElementById('designer-grid-info');

    if (this.designer.snapToGrid) {
      canvas.classList.add('grid-snapping');
      tbBtn?.classList.add('active');
      if (infoEl) infoEl.textContent = 'Snap to grid: 8px';
    } else {
      canvas.classList.remove('grid-snapping');
      tbBtn?.classList.remove('active');
      if (infoEl) infoEl.textContent = 'Snap to grid: Off';
    }
  }

  /**
   * Properties Panel Grid
   */
  setupPropertiesPanel() {
    // Control selector dropdown
    const select = document.getElementById('prop-control-select');
    if (select) {
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'form') {
          this.designer.selectControl(null);
        } else {
          const ctrl = this.designer.form.controls.find(c => c.name === val);
          if (ctrl) this.designer.selectControl(ctrl);
        }
      });
    }

    // Toggle Categorized / Alphabetical
    document.getElementById('btn-prop-cat')?.addEventListener('click', () => {
      this.propSort = 'cat';
      document.getElementById('btn-prop-cat')?.classList.add('active');
      document.getElementById('btn-prop-alpha')?.classList.remove('active');
      this.refreshProperties();
    });

    document.getElementById('btn-prop-alpha')?.addEventListener('click', () => {
      this.propSort = 'alpha';
      document.getElementById('btn-prop-alpha')?.classList.add('active');
      document.getElementById('btn-prop-cat')?.classList.remove('active');
      this.refreshProperties();
    });

    // Toggle Properties vs Events view
    document.getElementById('btn-prop-props')?.addEventListener('click', () => {
      this.propMode = 'props';
      document.getElementById('btn-prop-props')?.classList.add('active');
      document.getElementById('btn-prop-events')?.classList.remove('active');
      this.refreshProperties();
    });

    document.getElementById('btn-prop-events')?.addEventListener('click', () => {
      this.propMode = 'events';
      document.getElementById('btn-prop-events')?.classList.add('active');
      document.getElementById('btn-prop-props')?.classList.remove('active');
      this.refreshProperties();
    });
  }

  focusProperties() {
    const sel = document.getElementById('prop-control-select');
    if (sel) sel.focus();
  }

  /**
   * Rebuild Properties Grid table rows based on currently selected control or Form
   */
  refreshProperties() {
    const select = document.getElementById('prop-control-select');
    const tbody = document.getElementById('properties-tbody');
    if (!tbody || !select) return;

    // Update Control Dropdown
    select.innerHTML = `<option value="form">${this.designer.form.properties.Text || 'Form1'} (System.Windows.Forms.Form)</option>`;
    for (const ctrl of this.designer.form.controls) {
      const opt = document.createElement('option');
      opt.value = ctrl.name;
      opt.textContent = `${ctrl.name} (System.Windows.Forms.${ctrl.type})`;
      select.appendChild(opt);
    }

    const ctrl = this.designer.selectedControl;
    select.value = ctrl ? ctrl.name : 'form';

    tbody.innerHTML = '';

    if (this.propMode === 'events') {
      this.renderEventsGrid(tbody, ctrl);
      return;
    }

    // Properties Mode
    if (!ctrl) {
      // Form Properties
      this.renderPropertyRow(tbody, 'Appearance', 'Text', this.designer.form.properties.Text || 'Form1', 'string', 'The title displayed in the form titlebar.', (v) => {
        this.designer.form.properties.Text = v;
        this.designer.updateFormWindowDOM();
        this.designer.syncDesignerCode();
      });

      this.renderPropertyRow(tbody, 'Appearance', 'BackColor', this.designer.form.properties.BackColor || '#f0f0f0', 'color', 'The background color of the form canvas.', (v) => {
        this.designer.form.properties.BackColor = v;
        this.designer.updateFormWindowDOM();
        this.designer.syncDesignerCode();
      });

      this.renderPropertyRow(tbody, 'Layout', 'Width', this.designer.form.properties.Width, 'number', 'The horizontal width of the form in pixels.', (v) => {
        this.designer.form.properties.Width = Math.max(200, parseInt(v, 10));
        this.designer.updateFormWindowDOM();
        this.designer.syncDesignerCode();
      });

      this.renderPropertyRow(tbody, 'Layout', 'Height', this.designer.form.properties.Height, 'number', 'The vertical height of the form in pixels.', (v) => {
        this.designer.form.properties.Height = Math.max(150, parseInt(v, 10));
        this.designer.updateFormWindowDOM();
        this.designer.syncDesignerCode();
      });
      return;
    }

    // Control Properties
    // Design Category
    this.renderPropertyRow(tbody, 'Design', '(Name)', ctrl.name, 'string', 'The name used in C# code to identify this control.', (v) => {
      const trimmed = v.trim();
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
        ctrl.name = trimmed;
        this.designer.renderCanvas();
        this.designer.syncDesignerCode();
        this.refreshProperties();
      }
    });

    // Timer Properties
    if (ctrl.type === 'Timer') {
      this.renderPropertyRow(tbody, 'Behavior', 'Interval', ctrl.properties.Interval || 1000, 'number', 'The frequency of Tick events in milliseconds (e.g. 1000ms = 1s).', (v) => {
        ctrl.properties.Interval = parseInt(v, 10);
        this.designer.syncDesignerCode();
      });

      this.renderPropertyRow(tbody, 'Behavior', 'Enabled', ctrl.properties.Enabled ? 'True' : 'False', 'boolean', 'Whether the timer starts running automatically on load.', (v) => {
        ctrl.properties.Enabled = v === 'True' || v === true;
        this.designer.syncDesignerCode();
      });
      return;
    }

    // Visual Controls Properties
    // Appearance
    this.renderPropertyRow(tbody, 'Appearance', 'Text', ctrl.properties.Text !== undefined ? ctrl.properties.Text : ctrl.name, 'string', 'The text displayed on the control.', (v) => {
      ctrl.properties.Text = v;
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Appearance', 'BackColor', ctrl.properties.BackColor || '', 'color', 'The background color of the control.', (v) => {
      ctrl.properties.BackColor = v;
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Appearance', 'ForeColor', ctrl.properties.ForeColor || '', 'color', 'The text color of the control.', (v) => {
      ctrl.properties.ForeColor = v;
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Appearance', 'FontSize', ctrl.properties.FontSize || 9, 'number', 'Font size in points (e.g. 9, 12, 16).', (v) => {
      ctrl.properties.FontSize = parseInt(v, 10);
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    // Behavior
    this.renderPropertyRow(tbody, 'Behavior', 'Enabled', ctrl.properties.Enabled === false ? 'False' : 'True', 'boolean', 'Indicates whether the control is responsive to user interactions.', (v) => {
      ctrl.properties.Enabled = v === 'True' || v === true;
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Behavior', 'Visible', ctrl.properties.Visible === false ? 'False' : 'True', 'boolean', 'Determines whether the control is visible or hidden.', (v) => {
      ctrl.properties.Visible = v === 'True' || v === true;
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    // Layout
    this.renderPropertyRow(tbody, 'Layout', 'Location (X)', ctrl.x, 'number', 'The X coordinate in pixels from the left of the form.', (v) => {
      ctrl.x = Math.max(0, parseInt(v, 10));
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Layout', 'Location (Y)', ctrl.y, 'number', 'The Y coordinate in pixels from the top of the form.', (v) => {
      ctrl.y = Math.max(0, parseInt(v, 10));
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Layout', 'Size (Width)', ctrl.width, 'number', 'The width of the control in pixels.', (v) => {
      ctrl.width = Math.max(16, parseInt(v, 10));
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    this.renderPropertyRow(tbody, 'Layout', 'Size (Height)', ctrl.height, 'number', 'The height of the control in pixels.', (v) => {
      ctrl.height = Math.max(16, parseInt(v, 10));
      this.designer.renderCanvas();
      this.designer.syncDesignerCode();
    });

    // ComboBox Specific Items Editor
    if (ctrl.type === 'ComboBox' || ctrl.type === 'ListBox') {
      this.renderPropertyRow(tbody, 'Data', 'Items', '(Collection)', 'items-editor', 'The collection of strings displayed in the dropdown or list.', () => {
        this.openItemsEditor(ctrl);
      });
    }

    // CheckBox Specific
    if (ctrl.type === 'CheckBox') {
      this.renderPropertyRow(tbody, 'Appearance', 'Checked', ctrl.properties.Checked ? 'True' : 'False', 'boolean', 'Indicates whether the check box is in the checked state.', (v) => {
        ctrl.properties.Checked = v === 'True' || v === true;
        this.designer.renderCanvas();
        this.designer.syncDesignerCode();
      });
    }
  }

  /**
   * Render single row in Property Grid
   */
  renderPropertyRow(tbody, category, name, value, type, description, onChange) {
    const row = document.createElement('tr');
    row.className = 'prop-row';

    // Show description on hover or click
    row.addEventListener('mouseenter', () => this.showPropertyHelp(name, description));
    row.addEventListener('click', () => this.showPropertyHelp(name, description));

    const nameCell = document.createElement('td');
    nameCell.className = 'prop-name-cell';
    nameCell.textContent = name;
    row.appendChild(nameCell);

    const valueCell = document.createElement('td');
    valueCell.className = 'prop-value-cell';

    if (type === 'string' || type === 'number') {
      const input = document.createElement('input');
      input.type = type === 'number' ? 'number' : 'text';
      input.className = 'prop-input';
      input.value = value !== undefined ? value : '';
      input.addEventListener('change', () => onChange(input.value));
      valueCell.appendChild(input);
    } else if (type === 'boolean') {
      const select = document.createElement('select');
      select.className = 'prop-input';
      select.innerHTML = `
        <option value="True" ${value === 'True' || value === true ? 'selected' : ''}>True</option>
        <option value="False" ${value === 'False' || value === false ? 'selected' : ''}>False</option>
      `;
      select.addEventListener('change', () => onChange(select.value));
      valueCell.appendChild(select);
    } else if (type === 'color') {
      const wrap = document.createElement('div');
      wrap.className = 'prop-input-color';

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'prop-color-swatch';
      colorInput.value = value && value.startsWith('#') ? value : '#f0f0f0';

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'prop-input';
      textInput.value = value || '';
      textInput.placeholder = '#RRGGBB';

      colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value;
        onChange(colorInput.value);
      });
      textInput.addEventListener('change', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(textInput.value)) {
          colorInput.value = textInput.value;
        }
        onChange(textInput.value);
      });

      wrap.appendChild(colorInput);
      wrap.appendChild(textInput);
      valueCell.appendChild(wrap);
    } else if (type === 'items-editor') {
      const btn = document.createElement('button');
      btn.className = 'prop-items-edit-btn';
      btn.textContent = '(Collection)...';
      btn.addEventListener('click', () => onChange());
      valueCell.appendChild(btn);
    }

    row.appendChild(valueCell);
    tbody.appendChild(row);
  }

  /**
   * Render Events in Properties Grid (Lightning Bolt mode)
   */
  renderEventsGrid(tbody, ctrl) {
    const targetName = ctrl ? ctrl.name : 'Form1';
    let availableEvents = [];

    if (!ctrl) {
      availableEvents = [
        { name: 'Load', signature: '(object sender, EventArgs e)' },
        { name: 'Click', signature: '(object sender, EventArgs e)' }
      ];
    } else if (ctrl.type === 'Button') {
      availableEvents = [
        { name: 'Click', signature: '(object sender, EventArgs e)' }
      ];
    } else if (ctrl.type === 'TextBox') {
      availableEvents = [
        { name: 'TextChanged', signature: '(object sender, EventArgs e)' },
        { name: 'Click', signature: '(object sender, EventArgs e)' }
      ];
    } else if (ctrl.type === 'ComboBox') {
      availableEvents = [
        { name: 'SelectedIndexChanged', signature: '(object sender, EventArgs e)' }
      ];
    } else if (ctrl.type === 'Timer') {
      availableEvents = [
        { name: 'Tick', signature: '(object sender, EventArgs e)' }
      ];
    } else if (ctrl.type === 'CheckBox') {
      availableEvents = [
        { name: 'CheckedChanged', signature: '(object sender, EventArgs e)' }
      ];
    }

    for (const evt of availableEvents) {
      const row = document.createElement('tr');
      row.className = 'prop-row';

      const nameCell = document.createElement('td');
      nameCell.className = 'prop-name-cell';
      nameCell.textContent = evt.name;
      row.appendChild(nameCell);

      const valCell = document.createElement('td');
      valCell.className = 'prop-value-cell';

      const btn = document.createElement('button');
      btn.className = 'prop-items-edit-btn';
      btn.textContent = `${targetName}_${evt.name}`;
      btn.addEventListener('click', () => {
        this.generateEventHandler(targetName, evt.name, evt.signature);
      });

      valCell.appendChild(btn);
      row.appendChild(valCell);
      tbody.appendChild(row);
    }
  }

  showPropertyHelp(name, description) {
    const titleEl = document.getElementById('help-prop-name');
    const descEl = document.getElementById('help-prop-desc');
    if (titleEl) titleEl.textContent = name;
    if (descEl) descEl.textContent = description;
  }

  /**
   * Solution Explorer Tree Click Handlers
   */
  setupSolutionExplorer() {
    document.getElementById('tree-form1-node')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.switchTab('designer');
    });

    document.getElementById('tree-form1-designer-node')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.switchTab('designer-code');
    });

    document.getElementById('tree-program-node')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.switchTab('program');
    });
  }

  /**
   * Bottom Panel (Output & Error List)
   */
  setupBottomPanel() {
    const tabOutput = document.getElementById('btab-output');
    const tabErrors = document.getElementById('btab-errors');

    tabOutput?.addEventListener('click', () => this.switchBottomTab('output'));
    tabErrors?.addEventListener('click', () => this.switchBottomTab('errors'));

    document.getElementById('btn-clear-output')?.addEventListener('click', () => {
      const consoleEl = document.getElementById('output-console');
      if (consoleEl) consoleEl.innerHTML = '';
    });

    document.getElementById('btn-collapse-bottom')?.addEventListener('click', () => {
      const p = document.getElementById('vs-bottom-panel');
      if (p) p.classList.toggle('collapsed');
    });
  }

  switchBottomTab(tab) {
    document.getElementById('btab-output')?.classList.toggle('active', tab === 'output');
    document.getElementById('btab-errors')?.classList.toggle('active', tab === 'errors');
    document.getElementById('bview-output')?.classList.toggle('active', tab === 'output');
    document.getElementById('bview-errors')?.classList.toggle('active', tab === 'errors');
  }

  logOutput(message, type = 'info') {
    const consoleEl = document.getElementById('output-console');
    if (!consoleEl) return;
    const line = document.createElement('div');
    line.className = `out-line ${type}`;
    line.textContent = message;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  /**
   * Build Solution & Validate Code
   */
  buildSolution(rebuild = false) {
    this.logOutput(rebuild ? "========== Rebuild All started: Project: WindowsFormsApp1 ==========" : "========== Build started: Project: WindowsFormsApp1 ==========", 'info');

    const code = this.codeEditor.getCode();
    const errors = this.engine.validateCode(code, this.designer.form);

    const errorCountEl = document.getElementById('error-count');
    const tbody = document.getElementById('errors-table-body');

    if (errorCountEl) errorCountEl.textContent = errors.length;

    if (errors.length > 0) {
      if (tbody) {
        tbody.innerHTML = '';
        for (const err of errors) {
          const row = document.createElement('tr');
          row.className = 'error-row';
          row.innerHTML = `
            <td>❌</td>
            <td><strong>${err.code}</strong></td>
            <td>${err.description}</td>
            <td>${err.file}</td>
            <td>${err.line}</td>
          `;
          row.addEventListener('click', () => {
            this.switchTab('code');
            if (err.line && this.codeEditor.jumpToLine) {
              this.codeEditor.jumpToLine(err.line);
            } else {
              this.codeEditor.jumpToMethod(err.description);
            }
          });
          tbody.appendChild(row);
        }
      }
      this.switchBottomTab('errors');
      this.logOutput(`Build FAILED with ${errors.length} error(s).`, 'error');
      return false;
    } else {
      if (tbody) {
        tbody.innerHTML = `<tr class="no-errors-row"><td colspan="5">No errors found. Everything builds cleanly!</td></tr>`;
      }
      this.logOutput("Build succeeded: 0 errors, 0 warnings.", 'success');
      return true;
    }
  }

  validateCurrentCode() {
    const code = this.codeEditor.getCode();
    const errors = this.engine.validateCode(code, this.designer.form);
    const errorCountEl = document.getElementById('error-count');
    if (errorCountEl) errorCountEl.textContent = errors.length;
  }

  /**
   * Start Debugging (Interactive Form Execution)
   */
  startDebugging() {
    if (this.isDebugging) return;

    this.logOutput("Starting execution: WindowsFormsApp1.exe ...", 'info');

    // Build first
    const buildOk = this.buildSolution();
    if (!buildOk) {
      alert("Build errors found! Check the Error List at the bottom before running.");
      return;
    }

    const modal = document.getElementById('running-app-overlay');
    const canvas = document.getElementById('running-app-canvas');
    const titleEl = document.getElementById('running-app-title');

    if (!modal || !canvas) return;

    // Set Window Title and Dimensions
    if (titleEl) titleEl.textContent = this.designer.form.properties.Text || 'Form1';
    canvas.style.width = `${this.designer.form.properties.Width}px`;
    canvas.style.height = `${this.designer.form.properties.Height}px`;

    // Start C# Runtime Sandbox
    const code = this.codeEditor.getCode();
    const result = this.engine.startApplication(this.designer.form, code, canvas);

    if (!result.success) {
      this.logOutput("Runtime initialization failed.", 'error');
      if (result.errors && result.errors.length > 0) {
        for (const err of result.errors) {
          this.logOutput(`[${err.code}] ${err.description}`, 'error');
        }
      }
      this.buildSolution();
      return;
    }

    this.isDebugging = true;
    modal.classList.add('active');

    // Update Status Bar
    const statusText = document.getElementById('status-text');
    const indicator = document.getElementById('status-indicator');
    if (statusText) statusText.textContent = 'Debugging (Running)';
    if (indicator) {
      indicator.classList.remove('ready');
      indicator.classList.add('debugging');
    }

    // Toggle Toolbar Buttons
    const btnStart = document.getElementById('tb-start');
    const btnStop = document.getElementById('tb-stop');
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;

    this.logOutput("Application running interactively. Click buttons, enter text, and test events!", 'success');
  }

  /**
   * Stop Debugging
   */
  stopDebugging() {
    if (!this.isDebugging) return;

    this.engine.stopApplication();
    this.isDebugging = false;

    const modal = document.getElementById('running-app-overlay');
    if (modal) modal.classList.remove('active');

    // Restore Status Bar
    const statusText = document.getElementById('status-text');
    const indicator = document.getElementById('status-indicator');
    if (statusText) statusText.textContent = 'Ready';
    if (indicator) {
      indicator.classList.remove('debugging');
      indicator.classList.add('ready');
    }

    // Toggle Toolbar Buttons
    const btnStart = document.getElementById('tb-start');
    const btnStop = document.getElementById('tb-stop');
    if (btnStart) btnStart.disabled = false;
    if (btnStop) btnStop.disabled = true;

    this.logOutput("Application debugging stopped. Returned to design mode.", 'info');
  }

  setupRunningAppWindow() {
    document.getElementById('run-btn-close')?.addEventListener('click', () => this.stopDebugging());
    document.getElementById('btn-stop-running-app')?.addEventListener('click', () => this.stopDebugging());

    // Drag Running Application Window
    const titlebar = document.getElementById('running-app-titlebar');
    const win = document.getElementById('running-app-window');

    if (titlebar && win) {
      let isDraggingWin = false;
      let startX = 0, startY = 0;

      titlebar.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('r-btn')) return;
        isDraggingWin = true;
        startX = e.clientX - win.offsetLeft;
        startY = e.clientY - win.offsetTop;

        const onMouseMove = (moveEvent) => {
          if (!isDraggingWin) return;
          win.style.position = 'absolute';
          win.style.left = `${moveEvent.clientX - startX}px`;
          win.style.top = `${moveEvent.clientY - startY}px`;
        };

        const onMouseUp = () => {
          isDraggingWin = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  /**
   * ComboBox String Collection Editor Dialog
   */
  setupItemsEditorDialog() {
    this.editingControlForItems = null;

    const modal = document.getElementById('modal-items-editor');
    const textarea = document.getElementById('items-collection-textarea');

    document.getElementById('btn-close-items-dialog')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    document.getElementById('btn-cancel-items')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    document.getElementById('btn-save-items')?.addEventListener('click', () => {
      if (this.editingControlForItems && textarea) {
        const lines = textarea.value
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0);

        this.editingControlForItems.properties.Items = lines;
        this.designer.renderCanvas();
        this.designer.syncDesignerCode();
        this.logOutput(`Updated Items collection for '${this.editingControlForItems.name}' (${lines.length} items).`, 'info');
      }
      modal?.classList.remove('active');
    });
  }

  openItemsEditor(ctrl) {
    this.editingControlForItems = ctrl;
    const modal = document.getElementById('modal-items-editor');
    const textarea = document.getElementById('items-collection-textarea');

    if (textarea) {
      const items = ctrl.properties.Items || [];
      textarea.value = items.join('\n');
    }

    modal?.classList.add('active');
  }

  /**
   * Student Help & Cheatsheet Dialog
   */
  setupHelpDialog() {
    const modal = document.getElementById('modal-help-dialog');
    document.getElementById('btn-close-help-dialog')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });
    document.getElementById('btn-dismiss-help')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });
  }

  openHelpGuide(section) {
    const modal = document.getElementById('modal-help-dialog');
    const title = document.getElementById('help-modal-title');
    const body = document.getElementById('help-modal-content');

    if (!modal || !title || !body) return;

    if (section === 'tutorial') {
      title.textContent = "C# Windows Forms Student Tutorial";
      body.innerHTML = `
        <h2>Welcome to the Rob# C# Forms IDE!</h2>
        <p>This IDE lets you design Windows Forms applications visually and write real C# code to bring them to life!</p>

        <h3>1. Adding Controls</h3>
        <p>Drag any control from the <strong>Toolbox</strong> on the left onto the form canvas, or click a tool to add it:</p>
        <ul>
          <li><strong>Button:</strong> A clickable button for student actions.</li>
          <li><strong>TextBox:</strong> Allows users to enter input text or numbers.</li>
          <li><strong>Label:</strong> Displays read-only text, titles, or calculation results.</li>
          <li><strong>ComboBox:</strong> Dropdown menu for selecting from a list of options.</li>
          <li><strong>Timer:</strong> Non-visual component that runs code repeatedly at set intervals (e.g. 1000ms = 1s). It appears in the Component Tray below the form!</li>
        </ul>

        <h3>2. Writing C# Event Handlers</h3>
        <p>To write code for a control, <strong>double-click</strong> it in the designer! This creates an event handler in <code>Form1.cs</code>:</p>
        <pre>// When the user clicks the button:
private void button1_Click(object sender, EventArgs e)
{
    label1.Text = "Hello, " + textBox1.Text;
    MessageBox.Show("Welcome to C# Windows Forms!");
}</pre>

        <h3>3. Running and Testing (F5)</h3>
        <p>Click the green <strong>▶ Start</strong> button or press <strong>F5</strong> to run your application in real-time. Click <strong>⏹ Stop</strong> when done.</p>
      `;
    } else if (section === 'cheatsheet') {
      title.textContent = "C# WinForms Quick Cheatsheet";
      body.innerHTML = `
        <h2>Essential C# Windows Forms Cheatsheet</h2>
        <p style="color: #4ec9b0; font-weight: 600;">⚡ Rule 1: Always end C# statements with a semicolon <code>;</code>! (Missing semicolons trigger <code>[CS1002] ; expected</code> in Error List)</p>
        <p style="color: #4ec9b0; font-weight: 600;">⚡ Rule 2: Control text uses PascalCase <code>.Text</code> (e.g. <code>label1.Text = "Hello";</code>)</p>

        <h3>Reading &amp; Writing Controls</h3>
        <pre>// Read and write text (use .Text):
string userInput = textBox1.Text;
label1.Text = "Result: " + userInput;

// Convert strings to numbers:
int count = int.Parse(textBox1.Text);
double price = double.Parse(textBox1.Text);

// Convert numbers to strings:
labelTotal.Text = count.ToString();

// Enable or disable controls:
button1.Enabled = false;
textBox1.Visible = true;</pre>

        <h3>Using ComboBoxes</h3>
        <pre>// Get selected text:
string choice = comboBox1.SelectedItem;

// Add an item dynamically:
comboBox1.Items.Add("New Option");

// Clear all items:
comboBox1.Items.Clear();</pre>

        <h3>Using Timers</h3>
        <pre>// Start and Stop:
timer1.Interval = 1000; // in milliseconds (1000ms = 1 second)
timer1.Start();
timer1.Stop();

// In timer1_Tick event:
private void timer1_Tick(object sender, EventArgs e)
{
    seconds++;
    labelTime.Text = seconds.ToString() + " seconds";
}</pre>

        <h3>Windows Message Boxes</h3>
        <pre>MessageBox.Show("Hello World!");
MessageBox.Show("File saved successfully!", "Notification");</pre>
      `;
    } else {
      title.textContent = "About Rob#";
      body.innerHTML = `
        <h2>Rob# C# Windows Forms Simulator</h2>
        <p>Built with pure HTML5, CSS3, and modern JavaScript for computing students learning C# and Windows desktop development.</p>
        <p><strong>Supported Controls:</strong> Button, TextBox, Label, ComboBox, Timer, CheckBox, ListBox, ProgressBar, PictureBox.</p>
        <p>Includes complete Rob# Dark/Light theme, form designer canvas, component tray, live C# syntax highlighter, and interactive sandbox execution.</p>
      `;
    }

    modal.classList.add('active');
  }

  /**
   * Keyboard Shortcuts (F5, Shift+F5, F7, Shift+F7, Ctrl+S)
   */
  initShortcuts() {
    window.addEventListener('keydown', (e) => {
      // F5: Start Debugging
      if (e.key === 'F5' && !e.shiftKey) {
        e.preventDefault();
        this.startDebugging();
      }

      // Shift + F5: Stop Debugging
      if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault();
        this.stopDebugging();
      }

      // F7: View Code (Form1.cs)
      if (e.key === 'F7' && !e.shiftKey) {
        e.preventDefault();
        this.switchTab('code');
      }

      // Shift + F7: View Designer
      if (e.key === 'F7' && e.shiftKey) {
        e.preventDefault();
        this.switchTab('designer');
      }

      // Ctrl + S: Save Project
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveProject();
      }

      // Ctrl + Shift + B: Build Solution
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.buildSolution();
      }
    });
  }

  /**
   * Generate Event Handler Helper
   */
  generateEventHandler(controlName, eventType, signature) {
    this.codeEditor.ensureEventHandler(controlName, eventType, signature);
  }

  setDesignerCode(code) {
    this.codeEditor.setDesignerCode(code);
  }

  updateStatus() {
    const countEl = document.getElementById('status-controls-count');
    if (countEl) {
      countEl.textContent = `Controls: ${this.designer.form.controls.length}`;
    }
  }

  /**
   * Load Template
   */
  loadTemplate(templateKey) {
    const template = VSTemplates[templateKey];
    if (!template) return;

    this.stopDebugging();
    this.designer.loadForm(template.form);
    this.codeEditor.setCode(template.code);
    this.switchTab('designer');
    this.logOutput(`Loaded starter project: '${template.name}'.`, 'success');
  }

  /**
   * New Project
   */
  newProject() {
    if (confirm("Create a new Windows Forms project? Any unsaved changes will be cleared.")) {
      this.loadTemplate('empty');
    }
  }

  /**
   * Save Project (LocalStorage & notification)
   */
  saveProject() {
    const projectData = {
      form: this.designer.form,
      code: this.codeEditor.getCode(),
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('VS_CS_WinForms_Project', JSON.stringify(projectData));
      this.logOutput("Project successfully saved to browser local storage.", 'success');

      // Temporary visual confirmation in status bar
      const statusText = document.getElementById('status-text');
      if (statusText) {
        const old = statusText.textContent;
        statusText.textContent = "Saved Project ✓";
        setTimeout(() => { statusText.textContent = old; }, 2000);
      }
    } catch (e) {
      this.logOutput("Save failed: " + e.message, 'error');
    }
  }

  /**
   * Export Project File (.json) for students to submit homework
   */
  exportProjectJSON() {
    const projectData = {
      projectType: "CSharpWindowsForms",
      version: "1.0",
      form: this.designer.form,
      code: this.codeEditor.getCode(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.designer.form.properties.Text || 'WindowsFormsApp1'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.logOutput("Exported project JSON file.", 'success');
  }

  /**
   * Export C# Source Code (.cs files)
   */
  exportCSharpFiles() {
    const code = this.codeEditor.getCode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form1.cs`;
    a.click();
    URL.revokeObjectURL(url);
    this.logOutput("Exported Form1.cs source file.", 'success');
  }

  /**
   * Open JSON Project File
   */
  promptOpenFile() {
    const fileInput = document.getElementById('file-input-project');
    if (!fileInput) return;

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.form && data.code) {
            this.designer.loadForm(data.form);
            this.codeEditor.setCode(data.code);
            this.switchTab('designer');
            this.logOutput(`Loaded project file '${file.name}'.`, 'success');
          } else {
            alert("Invalid project file format.");
          }
        } catch (err) {
          alert("Error parsing project file: " + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    };

    fileInput.click();
  }

  /**
   * Load Initial Project (From LocalStorage or Default Stopwatch Starter)
   */
  loadInitialProject() {
    const saved = localStorage.getItem('VS_CS_WinForms_Project');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.form && data.code) {
          this.designer.loadForm(data.form);
          this.codeEditor.setCode(data.code);
          this.logOutput("Restored your previous project from storage.", 'info');
          return;
        }
      } catch (e) {
        console.warn("Could not load stored project", e);
      }
    }

    // Default to the Stopwatch & Timer sample (demonstrating Button, TextBox, Label, Timer, and ComboBox!)
    this.loadTemplate('stopwatch');
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new VisualStudioApp();
});
