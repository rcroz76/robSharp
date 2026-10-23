/**
 * WinForms Designer - Visual Studio Windows Forms Canvas Engine
 * Handles control drag/drop, movement, resizing, selection, component tray,
 * and C# Form1.Designer.cs code generation.
 */
class WinFormsDesigner {
  constructor(ide) {
    this.ide = ide;
    this.snapToGrid = true;
    this.gridSize = 8;
    this.selectedControl = null; // null means Form itself is selected
    this.isDragging = false;
    this.isResizing = false;
    this.resizeDirection = null;
    this.dragStart = { x: 0, y: 0 };
    this.controlStart = { x: 0, y: 0, width: 0, height: 0 };

    this.form = {
      properties: {
        Text: "Form1",
        Width: 480,
        Height: 360,
        BackColor: "#f0f0f0"
      },
      controls: []
    };

    this.typeCounters = {
      Button: 0,
      TextBox: 0,
      Label: 0,
      ComboBox: 0,
      Timer: 0,
      CheckBox: 0,
      ListBox: 0,
      ProgressBar: 0,
      PictureBox: 0
    };

    this.initDOM();
  }

  initDOM() {
    this.canvas = document.getElementById('winform-client-area');
    this.formWindow = document.getElementById('winform-window');
    this.formTitle = document.getElementById('winform-title-text');
    this.formResizeHandle = document.getElementById('form-resize-handle');
    this.trayContainer = document.getElementById('tray-items-container');
    this.trayHint = document.getElementById('tray-empty-hint');
    this.workArea = document.getElementById('designer-work-area');
    this.scrollWrapper = document.getElementById('designer-scroll-wrapper');

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Canvas Click (select Form)
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.target === this.canvas) {
        this.selectControl(null);
      }
    });

    // Double-click canvas (Form1_Load)
    this.canvas.addEventListener('dblclick', (e) => {
      if (e.target === this.canvas) {
        this.ide.generateEventHandler('Form1', 'Load', '(object sender, EventArgs e)');
      }
    });

    // Drag-over and Drop on Canvas
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const toolType = e.dataTransfer.getData('text/plain');
      if (toolType) {
        const rect = this.canvas.getBoundingClientRect();
        let rawX = e.clientX - rect.left;
        let rawY = e.clientY - rect.top;

        if (this.snapToGrid) {
          rawX = Math.round(rawX / this.gridSize) * this.gridSize;
          rawY = Math.round(rawY / this.gridSize) * this.gridSize;
        }

        this.addControl(toolType, rawX, rawY);
      }
    });

    // Drop on Component Tray for Timers
    const tray = document.getElementById('designer-component-tray');
    if (tray) {
      tray.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      tray.addEventListener('drop', (e) => {
        e.preventDefault();
        const toolType = e.dataTransfer.getData('text/plain');
        if (toolType === 'Timer') {
          this.addControl('Timer', 0, 0);
        } else if (toolType) {
          // Visual controls placed in tray get routed to canvas
          this.addControl(toolType, 20, 20);
        }
      });
    }

    // Form Window Resizing
    if (this.formResizeHandle) {
      this.formResizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = this.form.properties.Width;
        const startH = this.form.properties.Height;

        const onMouseMove = (moveEvent) => {
          let newW = startW + (moveEvent.clientX - startX);
          let newH = startH + (moveEvent.clientY - startY);

          if (this.snapToGrid) {
            newW = Math.round(newW / this.gridSize) * this.gridSize;
            newH = Math.round(newH / this.gridSize) * this.gridSize;
          }

          newW = Math.max(260, newW);
          newH = Math.max(180, newH);

          this.form.properties.Width = newW;
          this.form.properties.Height = newH;
          this.updateFormWindowDOM();
          this.ide.refreshProperties();
          this.syncDesignerCode();
        };

        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // Canvas Mouse Move (track coordinates for status bar)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.max(0, Math.round(e.clientX - rect.left));
      const y = Math.max(0, Math.round(e.clientY - rect.top));
      const el = document.getElementById('designer-cursor-pos');
      if (el) el.textContent = `X: ${x}, Y: ${y}`;
    });

    // Keyboard Shortcuts (Delete control)
    window.addEventListener('keydown', (e) => {
      // If student is typing inside an input/textarea, ignore Delete shortcut
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Delete') {
        if (this.selectedControl) {
          this.deleteControl(this.selectedControl.name);
        }
      }
    });
  }

  /**
   * Load a form state into the designer
   */
  loadForm(formData) {
    this.form = JSON.parse(JSON.stringify(formData));
    this.selectedControl = null;
    this.rebuildCounters();
    this.renderCanvas();
    this.syncDesignerCode();
    this.ide.refreshProperties();
    this.ide.updateStatus();
  }

  /**
   * Rebuild counters to ensure unique names (button1, button2, timer1, etc.)
   */
  rebuildCounters() {
    this.typeCounters = {
      Button: 0,
      TextBox: 0,
      Label: 0,
      ComboBox: 0,
      Timer: 0,
      CheckBox: 0,
      ListBox: 0,
      ProgressBar: 0,
      PictureBox: 0
    };

    for (const ctrl of this.form.controls) {
      const type = ctrl.type;
      if (this.typeCounters[type] !== undefined) {
        const match = ctrl.name.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > this.typeCounters[type]) {
            this.typeCounters[type] = num;
          }
        }
      }
    }
  }

  /**
   * Generate next unique name for a control type
   */
  generateName(type) {
    if (this.typeCounters[type] === undefined) {
      this.typeCounters[type] = 0;
    }
    this.typeCounters[type]++;
    const prefix = type.charAt(0).toLowerCase() + type.slice(1);
    return `${prefix}${this.typeCounters[type]}`;
  }

  /**
   * Add a control to the form
   */
  addControl(type, x = 30, y = 30) {
    const name = this.generateName(type);
    let width = 100;
    let height = 30;
    const properties = {
      Text: name,
      Enabled: true,
      Visible: true,
      BackColor: "",
      ForeColor: "",
      Font: "Segoe UI",
      FontSize: 9
    };

    switch (type) {
      case 'Button':
        width = 100;
        height = 30;
        properties.Text = name;
        break;
      case 'TextBox':
        width = 120;
        height = 24;
        properties.Text = "";
        break;
      case 'Label':
        width = 100;
        height = 24;
        properties.Text = name;
        break;
      case 'ComboBox':
        width = 140;
        height = 26;
        properties.Text = "";
        properties.Items = ["Option 1", "Option 2", "Option 3"];
        break;
      case 'Timer':
        width = 0;
        height = 0;
        properties.Interval = 1000;
        properties.Enabled = false;
        break;
      case 'CheckBox':
        width = 110;
        height = 24;
        properties.Text = name;
        properties.Checked = false;
        break;
      case 'ListBox':
        width = 130;
        height = 90;
        properties.Items = ["Item 1", "Item 2", "Item 3"];
        break;
      case 'ProgressBar':
        width = 160;
        height = 24;
        properties.Value = 50;
        break;
      case 'PictureBox':
        width = 100;
        height = 80;
        break;
    }

    const newControl = {
      name,
      type,
      x: type === 'Timer' ? 0 : Math.max(0, x),
      y: type === 'Timer' ? 0 : Math.max(0, y),
      width,
      height,
      properties
    };

    this.form.controls.push(newControl);
    this.renderCanvas();
    this.selectControl(newControl);
    this.syncDesignerCode();
    this.ide.refreshProperties();
    this.ide.updateStatus();
    this.ide.logOutput(`Added control '${name}' (${type}) to form.`, 'info');

    return newControl;
  }

  /**
   * Delete a control
   */
  deleteControl(controlName) {
    const idx = this.form.controls.findIndex(c => c.name === controlName);
    if (idx !== -1) {
      const removed = this.form.controls.splice(idx, 1)[0];
      this.selectedControl = null;
      this.renderCanvas();
      this.syncDesignerCode();
      this.ide.refreshProperties();
      this.ide.updateStatus();
      this.ide.logOutput(`Deleted control '${removed.name}'.`, 'info');
    }
  }

  /**
   * Delete all controls
   */
  clearAllControls() {
    this.form.controls = [];
    this.selectedControl = null;
    this.rebuildCounters();
    this.renderCanvas();
    this.syncDesignerCode();
    this.ide.refreshProperties();
    this.ide.updateStatus();
    this.ide.logOutput("Cleared all controls from form.", 'info');
  }

  /**
   * Select a control or the Form
   */
  selectControl(ctrl) {
    this.selectedControl = ctrl;

    // Update active highlight classes on canvas
    const allElements = this.canvas.querySelectorAll('.wf-control');
    allElements.forEach(el => el.classList.remove('selected'));

    const allTrayItems = this.trayContainer.querySelectorAll('.tray-item');
    allTrayItems.forEach(el => el.classList.remove('selected'));

    if (ctrl) {
      if (ctrl.type === 'Timer') {
        const trayEl = document.getElementById(`tray-${ctrl.name}`);
        if (trayEl) trayEl.classList.add('selected');
      } else {
        const ctrlEl = document.getElementById(`designer-${ctrl.name}`);
        if (ctrlEl) ctrlEl.classList.add('selected');
      }

      const infoEl = document.getElementById('designer-selected-info');
      if (infoEl) {
        infoEl.textContent = `Selected: ${ctrl.name} (${ctrl.type}) [X: ${ctrl.x}, Y: ${ctrl.y}, W: ${ctrl.width}, H: ${ctrl.height}]`;
      }
    } else {
      const infoEl = document.getElementById('designer-selected-info');
      if (infoEl) {
        infoEl.textContent = `Selected: ${this.form.properties.Text || 'Form1'} (Form) [${this.form.properties.Width} x ${this.form.properties.Height}]`;
      }
    }

    this.ide.refreshProperties();
  }

  /**
   * Update Form Window Size and Title in Designer DOM
   */
  updateFormWindowDOM() {
    this.formWindow.style.width = `${this.form.properties.Width}px`;
    this.formWindow.style.height = `${this.form.properties.Height}px`;
    this.canvas.style.backgroundColor = this.form.properties.BackColor || '#f0f0f0';
    this.formTitle.textContent = this.form.properties.Text || 'Form1';
  }

  /**
   * Render the entire Form Canvas and Component Tray
   */
  renderCanvas() {
    this.updateFormWindowDOM();

    // Clear canvas
    this.canvas.innerHTML = '';
    this.trayContainer.innerHTML = '';

    let timerCount = 0;

    for (const ctrl of this.form.controls) {
      if (ctrl.type === 'Timer') {
        timerCount++;
        this.renderTrayItem(ctrl);
      } else {
        this.renderControl(ctrl);
      }
    }

    if (this.trayHint) {
      this.trayHint.style.display = timerCount === 0 ? 'inline' : 'none';
    }

    // Re-highlight selected control
    if (this.selectedControl) {
      this.selectControl(this.selectedControl);
    }
  }

  /**
   * Render a Non-Visual control (e.g. Timer) in the Component Tray
   */
  renderTrayItem(ctrl) {
    const item = document.createElement('div');
    item.className = 'tray-item';
    item.id = `tray-${ctrl.name}`;
    item.innerHTML = `
      <span class="tray-item-icon">⏱</span>
      <span class="tray-item-name">${ctrl.name}</span>
      <span class="tray-item-type">[${ctrl.type}]</span>
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectControl(ctrl);
    });

    item.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      // Generate timer1_Tick
      this.ide.generateEventHandler(ctrl.name, 'Tick', '(object sender, EventArgs e)');
    });

    this.trayContainer.appendChild(item);
  }

  /**
   * Render a Visual Control on Canvas
   */
  renderControl(ctrl) {
    const el = document.createElement('div');
    el.className = 'wf-control';
    el.id = `designer-${ctrl.name}`;
    el.style.left = `${ctrl.x}px`;
    el.style.top = `${ctrl.y}px`;
    el.style.width = `${ctrl.width}px`;
    el.style.height = `${ctrl.height}px`;

    if (ctrl.properties.BackColor) el.style.backgroundColor = ctrl.properties.BackColor;
    if (ctrl.properties.ForeColor) el.style.color = ctrl.properties.ForeColor;
    if (ctrl.properties.Font) el.style.fontFamily = ctrl.properties.Font;
    if (ctrl.properties.FontSize) el.style.fontSize = `${ctrl.properties.FontSize}pt`;

    // Inner Control UI
    switch (ctrl.type) {
      case 'Button': {
        const btn = document.createElement('div');
        btn.className = 'wf-btn';
        btn.style.width = '100%';
        btn.style.height = '100%';
        btn.textContent = ctrl.properties.Text || ctrl.name;
        el.appendChild(btn);
        break;
      }

      case 'TextBox': {
        const txt = document.createElement('div');
        txt.className = 'wf-txt';
        txt.style.width = '100%';
        txt.style.height = '100%';
        txt.textContent = ctrl.properties.Text || '';
        el.appendChild(txt);
        break;
      }

      case 'Label': {
        const lbl = document.createElement('div');
        lbl.className = 'wf-lbl';
        lbl.style.width = '100%';
        lbl.style.height = '100%';
        lbl.textContent = ctrl.properties.Text || ctrl.name;
        el.appendChild(lbl);
        break;
      }

      case 'ComboBox': {
        const cmb = document.createElement('div');
        cmb.className = 'wf-cmb';
        cmb.style.width = '100%';
        cmb.style.height = '100%';
        const textSpan = document.createElement('span');
        textSpan.className = 'wf-cmb-text';
        textSpan.textContent = ctrl.properties.Text || (ctrl.properties.Items && ctrl.properties.Items[0]) || '';
        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'wf-cmb-arrow';
        arrowSpan.textContent = '▼';
        cmb.appendChild(textSpan);
        cmb.appendChild(arrowSpan);
        el.appendChild(cmb);
        break;
      }

      case 'CheckBox': {
        const chk = document.createElement('div');
        chk.className = 'wf-chk';
        chk.style.width = '100%';
        chk.style.height = '100%';
        const box = document.createElement('div');
        box.className = 'wf-chk-box';
        box.textContent = (ctrl.properties.Checked === true || ctrl.properties.Checked === 'True') ? '✓' : '';
        const label = document.createElement('span');
        label.textContent = ctrl.properties.Text || ctrl.name;
        chk.appendChild(box);
        chk.appendChild(label);
        el.appendChild(chk);
        break;
      }

      case 'ListBox': {
        const lst = document.createElement('div');
        lst.className = 'wf-lst';
        lst.style.width = '100%';
        lst.style.height = '100%';
        const items = ctrl.properties.Items || [];
        items.forEach((item, idx) => {
          const row = document.createElement('div');
          row.className = `wf-lst-item ${idx === 0 ? 'selected' : ''}`;
          row.textContent = item;
          lst.appendChild(row);
        });
        el.appendChild(lst);
        break;
      }

      case 'ProgressBar': {
        const pbr = document.createElement('div');
        pbr.className = 'wf-pbr';
        pbr.style.width = '100%';
        pbr.style.height = '100%';
        const fill = document.createElement('div');
        fill.className = 'wf-pbr-fill';
        fill.style.width = `${ctrl.properties.Value || 50}%`;
        pbr.appendChild(fill);
        el.appendChild(pbr);
        break;
      }

      case 'PictureBox': {
        const pic = document.createElement('div');
        pic.className = 'wf-pic';
        pic.style.width = '100%';
        pic.style.height = '100%';
        pic.innerHTML = '<span class="wf-pic-icon">🖼</span>';
        el.appendChild(pic);
        break;
      }

      default: {
        el.textContent = ctrl.name;
      }
    }

    // Add 8 resize handles
    const handlePositions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    for (const pos of handlePositions) {
      const handle = document.createElement('div');
      handle.className = `resize-handle handle-${pos}`;
      handle.dataset.direction = pos;
      el.appendChild(handle);

      // Handle Resizing Mouse Event
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.startResizing(ctrl, pos, e);
      });
    }

    // Control Selection & Dragging
    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('resize-handle')) return;
      e.stopPropagation();
      this.selectControl(ctrl);
      this.startDragging(ctrl, e);
    });

    // Control Double-Click (generate C# event handler)
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      let eventType = 'Click';
      let eventSignature = '(object sender, EventArgs e)';

      if (ctrl.type === 'Button') eventType = 'Click';
      else if (ctrl.type === 'TextBox') eventType = 'TextChanged';
      else if (ctrl.type === 'ComboBox') eventType = 'SelectedIndexChanged';
      else if (ctrl.type === 'CheckBox') eventType = 'CheckedChanged';

      this.ide.generateEventHandler(ctrl.name, eventType, eventSignature);
    });

    this.canvas.appendChild(el);
  }

  /**
   * Start moving control
   */
  startDragging(ctrl, event) {
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.controlStart = { x: ctrl.x, y: ctrl.y, width: ctrl.width, height: ctrl.height };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      let dx = e.clientX - this.dragStart.x;
      let dy = e.clientY - this.dragStart.y;

      let newX = this.controlStart.x + dx;
      let newY = this.controlStart.y + dy;

      if (this.snapToGrid) {
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
      }

      newX = Math.max(0, Math.min(this.form.properties.Width - ctrl.width, newX));
      newY = Math.max(0, Math.min(this.form.properties.Height - ctrl.height, newY));

      ctrl.x = newX;
      ctrl.y = newY;

      const el = document.getElementById(`designer-${ctrl.name}`);
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }

      const infoEl = document.getElementById('designer-selected-info');
      if (infoEl) {
        infoEl.textContent = `Selected: ${ctrl.name} (${ctrl.type}) [X: ${ctrl.x}, Y: ${ctrl.y}, W: ${ctrl.width}, H: ${ctrl.height}]`;
      }

      this.ide.refreshProperties();
    };

    const onMouseUp = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.syncDesignerCode();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Start resizing control from a handle
   */
  startResizing(ctrl, dir, event) {
    this.isResizing = true;
    this.resizeDirection = dir;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.controlStart = { x: ctrl.x, y: ctrl.y, width: ctrl.width, height: ctrl.height };

    const onMouseMove = (e) => {
      if (!this.isResizing) return;
      let dx = e.clientX - this.dragStart.x;
      let dy = e.clientY - this.dragStart.y;

      let newX = this.controlStart.x;
      let newY = this.controlStart.y;
      let newW = this.controlStart.width;
      let newH = this.controlStart.height;

      if (dir.includes('e')) newW = this.controlStart.width + dx;
      if (dir.includes('s')) newH = this.controlStart.height + dy;
      if (dir.includes('w')) {
        newW = this.controlStart.width - dx;
        newX = this.controlStart.x + dx;
      }
      if (dir.includes('n')) {
        newH = this.controlStart.height - dy;
        newY = this.controlStart.y + dy;
      }

      if (this.snapToGrid) {
        newW = Math.round(newW / this.gridSize) * this.gridSize;
        newH = Math.round(newH / this.gridSize) * this.gridSize;
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
      }

      newW = Math.max(16, newW);
      newH = Math.max(16, newH);

      ctrl.x = newX;
      ctrl.y = newY;
      ctrl.width = newW;
      ctrl.height = newH;

      const el = document.getElementById(`designer-${ctrl.name}`);
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
      }

      this.ide.refreshProperties();
    };

    const onMouseUp = () => {
      this.isResizing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.syncDesignerCode();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Align selected control center
   */
  alignCenter() {
    if (!this.selectedControl || this.selectedControl.type === 'Timer') return;
    const formWidth = this.form.properties.Width;
    let newX = Math.round((formWidth - this.selectedControl.width) / 2);
    if (this.snapToGrid) {
      newX = Math.round(newX / this.gridSize) * this.gridSize;
    }
    this.selectedControl.x = Math.max(0, newX);
    this.renderCanvas();
    this.syncDesignerCode();
    this.ide.refreshProperties();
  }

  /**
   * Synchronize and generate Form1.Designer.cs authentic C# code
   */
  syncDesignerCode() {
    let code = `namespace WindowsFormsApp1
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
`;

    // 1. Instantiations
    for (const ctrl of this.form.controls) {
      code += `            this.${ctrl.name} = new System.Windows.Forms.${ctrl.type}();\n`;
    }
    code += `            this.SuspendLayout();\n`;

    // 2. Control Configurations
    for (const ctrl of this.form.controls) {
      code += `            //\n            // ${ctrl.name}\n            //\n`;
      if (ctrl.type === 'Timer') {
        code += `            this.${ctrl.name}.Interval = ${ctrl.properties.Interval || 1000};\n`;
        code += `            this.${ctrl.name}.Tick += new System.EventHandler(this.${ctrl.name}_Tick);\n`;
      } else {
        code += `            this.${ctrl.name}.Location = new System.Drawing.Point(${ctrl.x}, ${ctrl.y});\n`;
        code += `            this.${ctrl.name}.Name = "${ctrl.name}";\n`;
        code += `            this.${ctrl.name}.Size = new System.Drawing.Size(${ctrl.width}, ${ctrl.height});\n`;
        if (ctrl.properties.Text !== undefined) {
          code += `            this.${ctrl.name}.Text = "${ctrl.properties.Text.replace(/"/g, '\\"')}";\n`;
        }
        if (ctrl.type === 'Button') {
          code += `            this.${ctrl.name}.UseVisualStyleBackColor = true;\n`;
          code += `            this.${ctrl.name}.Click += new System.EventHandler(this.${ctrl.name}_Click);\n`;
        } else if (ctrl.type === 'ComboBox') {
          if (ctrl.properties.Items && ctrl.properties.Items.length > 0) {
            code += `            this.${ctrl.name}.Items.AddRange(new object[] {\n`;
            ctrl.properties.Items.forEach((it, idx) => {
              const comma = idx === ctrl.properties.Items.length - 1 ? '' : ',';
              code += `                "${it.replace(/"/g, '\\"')}"${comma}\n`;
            });
            code += `            });\n`;
          }
          code += `            this.${ctrl.name}.SelectedIndexChanged += new System.EventHandler(this.${ctrl.name}_SelectedIndexChanged);\n`;
        } else if (ctrl.type === 'TextBox') {
          code += `            this.${ctrl.name}.TextChanged += new System.EventHandler(this.${ctrl.name}_TextChanged);\n`;
        }
      }
    }

    // 3. Form Configuration
    code += `            //\n            // Form1\n            //\n`;
    code += `            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);\n`;
    code += `            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;\n`;
    code += `            this.ClientSize = new System.Drawing.Size(${this.form.properties.Width}, ${this.form.properties.Height});\n`;

    for (const ctrl of this.form.controls) {
      if (ctrl.type !== 'Timer') {
        code += `            this.Controls.Add(this.${ctrl.name});\n`;
      }
    }

    code += `            this.Name = "Form1";\n`;
    code += `            this.Text = "${(this.form.properties.Text || 'Form1').replace(/"/g, '\\"')}";\n`;
    code += `            this.Load += new System.EventHandler(this.Form1_Load);\n`;
    code += `            this.ResumeLayout(false);\n`;
    code += `        }\n\n        #endregion\n\n`;

    // 4. Declarations
    for (const ctrl of this.form.controls) {
      code += `        private System.Windows.Forms.${ctrl.type} ${ctrl.name};\n`;
    }

    code += `    }\n}\n`;

    this.ide.setDesignerCode(code);
  }
}

window.WinFormsDesigner = WinFormsDesigner;
