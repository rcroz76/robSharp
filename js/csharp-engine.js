/**
 * CSharpEngine - Client-Side C# WinForms Runtime & Compiler for Students
 * Parses, validates, and executes C# Form1 code in an interactive sandbox.
 */
// Standard known C# keywords, types, methods, and libraries
const CSHARP_BUILTINS = new Set([
  // Types & primitives
  'int', 'string', 'double', 'float', 'bool', 'char', 'long', 'short', 'byte', 'sbyte', 'uint', 'ulong', 'ushort', 'decimal', 'object', 'void', 'var', 'dynamic',
  'Int16', 'Int32', 'Int64', 'UInt16', 'UInt32', 'UInt64', 'Byte', 'SByte', 'Single', 'Double', 'Decimal', 'String', 'Boolean', 'Char', 'Object',
  'DateTime', 'TimeSpan', 'Color', 'Font', 'FontFamily', 'Point', 'Size', 'Rectangle', 'Image', 'Bitmap', 'Icon', 'Graphics', 'Pen', 'Brush', 'Brushes', 'SolidBrush',
  'Array', 'List', 'Dictionary', 'Queue', 'Stack', 'HashSet', 'Tuple', 'Action', 'Func', 'Nullable', 'Exception',
  // WinForms & Runtime APIs
  'MessageBox', 'MessageBoxButtons', 'MessageBoxIcon', 'DialogResult',
  'Console', 'Math', 'Convert', 'Random', 'CSharpRandom',
  'System', 'Drawing', 'Windows', 'Forms', 'Threading', 'Tasks', 'Collections', 'Generic', 'Text', 'IO', 'Linq',
  'Application', 'Cursor', 'Cursors', 'Screen', 'Component', 'Environment', 'File', 'Directory', 'Path', 'Regex', 'Thread',
  'Form', 'Button', 'TextBox', 'Label', 'ComboBox', 'Timer', 'CheckBox', 'ListBox', 'ProgressBar', 'PictureBox',
  'Control', 'Component',
  // Event & Form members
  'EventArgs', 'MouseEventArgs', 'KeyEventArgs', 'KeyPressEventArgs', 'PaintEventArgs', 'CancelEventArgs',
  'this', 'base', 'Form1', 'InitializeComponent', 'Close', 'Show', 'Hide', 'sender', 'e',
  // Form common properties
  'Text', 'Width', 'Height', 'BackColor', 'ForeColor', 'Font', 'Size', 'Location', 'Enabled', 'Visible', 'Name', 'Tag',
  // Values and control flow
  'true', 'false', 'null', 'value',
  'if', 'else', 'while', 'for', 'foreach', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'try', 'catch', 'finally', 'throw', 'using', 'namespace', 'class', 'struct', 'interface', 'enum',
  'public', 'private', 'protected', 'internal', 'static', 'partial', 'override', 'virtual', 'readonly', 'const',
  'get', 'set', 'lock', 'as', 'is', 'typeof', 'sizeof', 'new', 'in', 'out', 'ref', 'params'
]);

class CSharpEngine {
  constructor(ide) {
    this.ide = ide;
    this.activeTimers = new Map();
    this.executionState = {};
    this.controls = {};
  }

  /**
   * Helper to extract variable names and types from a C# declaration line
   */
  extractTypedVariablesFromLine(line) {
    const vars = [];
    const typePattern = /^\s*(?:public|private|protected|internal)?\s*(?:static)?\s*(?:readonly)?\s*(?:const)?\s*(int|string|double|float|bool|char|long|short|byte|decimal|object|var|[A-Z][a-zA-Z0-9_<>[\]]*)\s+([^;]+);?/;
    const match = line.match(typePattern);
    if (match) {
      let typeName = match[1];
      if (typeName === 'return' || typeName === 'class' || typeName === 'namespace' || typeName === 'using') {
        return vars;
      }
      if (typeName === 'String') typeName = 'string';
      if (typeName === 'Int32') typeName = 'int';
      if (typeName === 'Double') typeName = 'double';
      if (typeName === 'Boolean') typeName = 'bool';

      const decls = match[2].split(',');
      for (const d of decls) {
        const vMatch = d.trim().match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (vMatch && !CSHARP_BUILTINS.has(vMatch[1])) {
          vars.push({ name: vMatch[1], type: typeName });
        }
      }
    }
    return vars;
  }

  extractVariablesFromLine(line) {
    return this.extractTypedVariablesFromLine(line).map(v => v.name);
  }

  /**
   * Infer the C# type of an expression for semantic type checking
   */
  inferExpressionType(expr, scopeTypes) {
    let trimmed = expr.trim();
    // Strip outer parens: ((age)) -> age
    while (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      let depth = 0;
      let matchAll = true;
      for (let i = 0; i < trimmed.length - 1; i++) {
        if (trimmed[i] === '(') depth++;
        else if (trimmed[i] === ')') {
          depth--;
          if (depth === 0) { matchAll = false; break; }
        }
      }
      if (matchAll) {
        trimmed = trimmed.substring(1, trimmed.length - 1).trim();
      } else {
        break;
      }
    }

    if (!trimmed) return 'unknown';

    // 1. Conversion methods returning numeric types
    if (/^int\.Parse\s*\(/.test(trimmed) || /^Convert\.ToInt32\s*\(/.test(trimmed)) {
      return 'int';
    }
    if (/^double\.Parse\s*\(/.test(trimmed) || /^Convert\.ToDouble\s*\(/.test(trimmed)) {
      return 'double';
    }
    if (/^float\.Parse\s*\(/.test(trimmed)) {
      return 'float';
    }

    // 2. String literals or string placeholders
    if (/^"(?:[^"\\]|\\.)*"$/.test(trimmed) || /^"__STR_\d+__"$/.test(trimmed) || /^\$"[^"]*"$/.test(trimmed)) {
      return 'string';
    }

    // 3. Integer literals: 45, -5
    if (/^-?\d+$/.test(trimmed)) {
      return 'int';
    }

    // 4. Float / Double literals: 3.14, 3.14f
    if (/^-?\d+\.\d+f?$/i.test(trimmed)) {
      return trimmed.toLowerCase().endsWith('f') ? 'float' : 'double';
    }

    // 5. Booleans
    if (trimmed === 'true' || trimmed === 'false') {
      return 'bool';
    }

    // 6. Direct control string properties
    if (/\b(?:[a-zA-Z0-9_]+)\.(?:Text|SelectedItem)\b/.test(trimmed)) {
      return 'string';
    }

    // 7. ToString() or Convert.ToString()
    if (/\.ToString\s*\(\s*\)/.test(trimmed) || /^Convert\.ToString\s*\(/.test(trimmed)) {
      return 'string';
    }

    // 8. Control numeric properties
    if (/\b(?:[a-zA-Z0-9_]+)\.(?:Interval|Width|Height|Left|Top|SelectedIndex)\b/.test(trimmed)) {
      return 'int';
    }

    // 9. Single identifier check against scopeTypes
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      if (scopeTypes && scopeTypes.has(trimmed)) {
        return scopeTypes.get(trimmed);
      }
    }

    // 10. Check if expression contains known string variable
    if (scopeTypes) {
      const tokens = trimmed.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
      if (tokens) {
        for (const tok of tokens) {
          if (scopeTypes.get(tok) === 'string') {
            return 'string';
          }
        }
      }
    }

    // Arithmetic on numbers e.g. count - step, score + 10
    if (/^[a-zA-Z0-9_\s\+\-\*\/\%]+$/.test(trimmed)) {
      return 'int';
    }

    return 'unknown';
  }

  /**
   * Validate and parse student C# code, returning errors list
   */
  validateCode(code, formDefinition = null) {
    const errors = [];
    const lines = code.split('\n');

    // Resolve form definition if not directly passed
    if (!formDefinition && this.ide && this.ide.designer && this.ide.designer.form) {
      formDefinition = this.ide.designer.form;
    }

    // 1. Collect known controls from the form
    const knownControls = new Set();
    const lowerControlMap = new Map();
    const controls = (formDefinition && formDefinition.controls) || [];
    for (const ctrl of controls) {
      if (ctrl.name) {
        knownControls.add(ctrl.name);
        lowerControlMap.set(ctrl.name.toLowerCase(), ctrl.name);
      }
    }

    // 2. Extract class-level fields, methods, parameters, and local variables
    const classMatch = code.match(/class\s+Form1[^{]*\{([\s\S]*)\}\s*$/m) ||
                       code.match(/class\s+Form1[^{]*\{([\s\S]*)/m);
    
    const classFields = new Set();
    const classFieldTypes = new Map();
    const classMethods = new Set();
    const methodScopes = [];

    if (classMatch) {
      const classBody = classMatch[1];
      
      // Parse methods
      const methodRegex = /(?:public|private|protected|internal)?\s*(?:static)?\s*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
      const reservedKeywords = new Set(['if', 'else', 'while', 'for', 'foreach', 'switch', 'case', 'catch', 'finally', 'using', 'lock', 'return']);
      let match;

      while ((match = methodRegex.exec(classBody)) !== null) {
        const methodName = match[2];
        if (reservedKeywords.has(methodName)) continue;
        classMethods.add(methodName);

        const rawParams = match[3] || '';
        const params = new Set();
        const paramTypes = new Map();
        rawParams.split(',').forEach(p => {
          const parts = p.trim().split(/\s+/);
          if (parts.length > 1) {
            let pType = parts[parts.length - 2];
            const pName = parts[parts.length - 1];
            if (pType === 'String') pType = 'string';
            if (pType === 'Int32') pType = 'int';
            if (pType === 'Double') pType = 'double';
            if (pType === 'Boolean') pType = 'bool';
            params.add(pName);
            paramTypes.set(pName, pType);
          }
        });

        const startIndex = match.index + match[0].length;
        let braceDepth = 1;
        let bodyEnd = -1;
        for (let k = startIndex; k < classBody.length; k++) {
          if (classBody[k] === '{') braceDepth++;
          else if (classBody[k] === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              bodyEnd = k;
              break;
            }
          }
        }

        if (bodyEnd !== -1) {
          const methodBody = classBody.substring(startIndex, bodyEnd);
          const beforeMethod = code.substring(0, code.indexOf(match[0]));
          const methodStartLine = beforeMethod.split('\n').length;
          const methodEndLine = methodStartLine + (match[0] + methodBody).split('\n').length;

          const locals = new Set(params);
          const localTypes = new Map(paramTypes);
          const bodyLines = methodBody.split('\n');
          for (const bLine of bodyLines) {
            const stripped = bLine.replace(/"(?:[^"\\]|\\.)*"/g, '""').trim();
            const foundVars = this.extractTypedVariablesFromLine(stripped);
            for (const fv of foundVars) {
              locals.add(fv.name);
              localTypes.set(fv.name, fv.type);
            }

            const forMatch = stripped.match(/\bfor\s*\(\s*(int|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            if (forMatch) {
              locals.add(forMatch[2]);
              localTypes.set(forMatch[2], forMatch[1] === 'var' ? 'int' : forMatch[1]);
            }

            const foreachMatch = stripped.match(/\bforeach\s*\(\s*(var|[a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\b/);
            if (foreachMatch) {
              locals.add(foreachMatch[2]);
              localTypes.set(foreachMatch[2], foreachMatch[1]);
            }

            const catchMatch = stripped.match(/\bcatch\s*\(\s*(?:Exception|[a-zA-Z0-9_]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
            if (catchMatch) {
              locals.add(catchMatch[1]);
              localTypes.set(catchMatch[1], 'Exception');
            }
          }

          methodScopes.push({
            name: methodName,
            startLine: methodStartLine,
            endLine: methodEndLine,
            locals,
            localTypes
          });

          methodRegex.lastIndex = bodyEnd + 1;
        }
      }

      // Extract class-level fields
      const classLines = classBody.split('\n');
      for (const cLine of classLines) {
        const stripped = cLine.replace(/"(?:[^"\\]|\\.)*"/g, '""').trim();
        if (stripped.includes(';') && !stripped.includes('(')) {
          const foundFields = this.extractTypedVariablesFromLine(stripped);
          for (const ff of foundFields) {
            classFields.add(ff.name);
            classFieldTypes.set(ff.name, ff.type);
          }
        }
      }
    }

    let openBraces = 0;
    let openParens = 0;
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const rawLine = lines[i];
      let line = rawLine;

      // Handle multi-line block comments
      if (inBlockComment) {
        const endComment = line.indexOf('*/');
        if (endComment !== -1) {
          inBlockComment = false;
          line = line.substring(endComment + 2);
        } else {
          continue;
        }
      }

      const startComment = line.indexOf('/*');
      if (startComment !== -1) {
        const endComment = line.indexOf('*/', startComment + 2);
        if (endComment !== -1) {
          line = line.substring(0, startComment) + line.substring(endComment + 2);
        } else {
          inBlockComment = true;
          line = line.substring(0, startComment);
        }
      }

      // Strip single-line comments from the end of the line
      const singleComment = line.indexOf('//');
      if (singleComment !== -1) {
        line = line.substring(0, singleComment);
      }

      const trimmed = line.trim();

      // Count braces & parens
      for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '(') openParens++;
        if (char === ')') openParens--;
      }

      if (openBraces < 0) {
        errors.push({
          code: 'CS1022',
          description: "Type or namespace definition, or end-of-file expected (Extra '}')",
          file: 'Form1.cs',
          line: lineNumber
        });
        openBraces = 0;
      }

      // Remove string literals for safe identifier / syntax checks
      const lineWithoutStrings = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');

      // Skip using directives & namespaces for identifier checking
      const isUsingOrNamespace = /^\s*(using|namespace)\b/.test(trimmed);

      // Skip preprocessor and attributes
      const isPreprocessorOrAttr = trimmed.startsWith('#') || (trimmed.startsWith('[') && trimmed.endsWith(']'));

      if (!isUsingOrNamespace && !isPreprocessorOrAttr) {
        // Find current method scope locals and types
        const activeScope = methodScopes.find(s => lineNumber >= s.startLine && lineNumber <= s.endLine);
        const activeLocals = activeScope ? activeScope.locals : new Set();
        const activeScopeTypes = new Map([...classFieldTypes, ...(activeScope ? activeScope.localTypes : [])]);

        // Check 1: Illegal lowercase .text (C# requires PascalCase .Text)
        const textMatch = lineWithoutStrings.match(/\b([a-zA-Z0-9_]+)\.text\b/);
        if (textMatch) {
          errors.push({
            code: 'CS1061',
            description: `'${textMatch[1]}' does not contain a definition for 'text'. Did you mean 'Text'? In C#, property names are case-sensitive.`,
            file: 'Form1.cs',
            line: lineNumber
          });
        }

        // Check 2: Control casing mismatch anywhere in executable code!
        // e.g. student writes textbox1 instead of textBox1
        const tokenRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        let tok;
        while ((tok = tokenRegex.exec(lineWithoutStrings)) !== null) {
          const word = tok[1];
          const lowerWord = word.toLowerCase();

          if (lowerControlMap.has(lowerWord)) {
            const correctName = lowerControlMap.get(lowerWord);
            if (word !== correctName) {
              errors.push({
                code: 'CS0103',
                description: `The name '${word}' does not exist in the current context. Did you mean '${correctName}'? In C#, identifiers are case-sensitive.`,
                file: 'Form1.cs',
                line: lineNumber
              });
            }
          }
        }

        // Check 3: Root member access on an object that does not exist at all!
        // e.g. textBox99.Text, fakeButton.Enabled
        const rootMemberAccessRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\./g;
        let mAccess;
        while ((mAccess = rootMemberAccessRegex.exec(lineWithoutStrings)) !== null) {
          const target = mAccess[1];
          const lowerTarget = target.toLowerCase();
          const matchIdx = mAccess.index;

          // Check if preceded by dot, closing paren, or closing bracket (e.g. obj.member.submember)
          const prefix = lineWithoutStrings.substring(0, matchIdx).trimEnd();
          if (prefix.endsWith('.') || prefix.endsWith(')') || prefix.endsWith(']')) {
            continue;
          }

          const isValid =
            knownControls.has(target) ||
            activeLocals.has(target) ||
            classFields.has(target) ||
            classMethods.has(target) ||
            CSHARP_BUILTINS.has(target);

          if (!isValid) {
            // Avoid duplicate error if already caught by case mismatch above
            if (!lowerControlMap.has(lowerTarget)) {
              errors.push({
                code: 'CS0103',
                description: `The name '${target}' does not exist in the current context (no control or variable named '${target}' was found).`,
                file: 'Form1.cs',
                line: lineNumber
              });
            }
          }
        }

        // Check 4: Type compatibility for relational operators (<, >, <=, >=) and equality (==, !=)
        // C# strictly disallows relational operators on strings (CS0019)
        const lineWithMaskedStrings = line.replace(/"(?:[^"\\]|\\.)*"/g, '"__STR__"');

        const targetExpressions = [];
        const cfMatch = lineWithMaskedStrings.match(/\b(?:if|while)\s*\(([\s\S]*)\)\s*$/) ||
                        lineWithMaskedStrings.match(/\b(?:if|while)\s*\(([\s\S]*)\)/);
        if (cfMatch) {
          targetExpressions.push(cfMatch[1]);
        } else {
          const forMatch = lineWithMaskedStrings.match(/\bfor\s*\([^;]*;([^;]+);[^)]*\)/);
          if (forMatch) {
            targetExpressions.push(forMatch[1]);
          } else if (/[<>=!]/.test(lineWithMaskedStrings) && !lineWithMaskedStrings.includes('=>') && !lineWithMaskedStrings.includes('List<') && !lineWithMaskedStrings.includes('Dictionary<')) {
            targetExpressions.push(lineWithMaskedStrings);
          }
        }

        for (const exprBlock of targetExpressions) {
          const subClauses = exprBlock.split(/&&|\|\|/);
          for (let clause of subClauses) {
            clause = clause.trim();
            while (clause.startsWith('(') && clause.endsWith(')')) {
              let depth = 0;
              let matchAll = true;
              for (let k = 0; k < clause.length - 1; k++) {
                if (clause[k] === '(') depth++;
                else if (clause[k] === ')') {
                  depth--;
                  if (depth === 0) { matchAll = false; break; }
                }
              }
              if (matchAll) clause = clause.slice(1, -1).trim();
              else break;
            }

            const cmpMatch = clause.match(/([a-zA-Z0-9_\.\s\+\-\*\/\%\(\)]+?)\s*(>=|<=|==|!=|>|<)\s*([a-zA-Z0-9_\.\s\+\-\*\/\%\(\)"]+)/);
            if (cmpMatch) {
              const rawLhs = cmpMatch[1].trim();
              const op = cmpMatch[2];
              const rawRhs = cmpMatch[3].trim();

              const lhsType = this.inferExpressionType(rawLhs, activeScopeTypes);
              const rhsType = this.inferExpressionType(rawRhs, activeScopeTypes);

              const isRelational = (op === '>' || op === '<' || op === '>=' || op === '<=');
              const isEquality = (op === '==' || op === '!=');

              // CS0019: Relational operators cannot be applied to strings in C#
              if (isRelational && (lhsType === 'string' || rhsType === 'string')) {
                errors.push({
                  code: 'CS0019',
                  description: `Operator '${op}' cannot be applied to operands of type '${lhsType}' and '${rhsType}' (strings cannot be compared using relational operators; convert to int or double first).`,
                  file: 'Form1.cs',
                  line: lineNumber
                });
              }

              // CS0019: Equality between string and numeric types is not allowed in C#
              if (isEquality) {
                const isNumeric = (t) => (t === 'int' || t === 'double' || t === 'float');
                if ((lhsType === 'string' && isNumeric(rhsType)) || (isNumeric(lhsType) && rhsType === 'string')) {
                  errors.push({
                    code: 'CS0019',
                    description: `Operator '${op}' cannot be applied to operands of type '${lhsType}' and '${rhsType}' (cannot compare string with numeric type).`,
                    file: 'Form1.cs',
                    line: lineNumber
                  });
                }
              }
            }
          }
        }
      }

      // Check 5: Semicolon Validation (CS1002: ; expected)
      if (!trimmed) continue;

      // Skip preprocessor directives & attributes
      if (isPreprocessorOrAttr) continue;

      // Skip block boundaries
      if (trimmed.endsWith('{') || trimmed.endsWith('}')) continue;

      // Skip control flow headers (if, else, while, for, foreach, switch, try, catch, finally, lock)
      if (/^(if|else|while|for|foreach|switch|try|catch|finally|lock)\b/.test(trimmed)) {
        if (!trimmed.endsWith(';')) continue;
      }

      // Skip namespace, class, interface, struct, enum definitions
      if (/\b(namespace|class|interface|struct|enum)\b/.test(trimmed)) continue;

      // Skip method headers and constructors e.g. 'private void button1_Click(object sender, EventArgs e)' or 'public Form1()'
      if (/(?:public|private|protected|internal)?\s*(?:static)?\s*(?:void|[a-zA-Z0-9_<>[\]]+)?\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*$/.test(trimmed)) {
        continue;
      }

      // Skip lines ending with continuation operators (+, -, *, /, %, =, &&, ||, ,, ?, :, (, [)
      if (/[+\-*\/%=&|,?:(\[]$/.test(trimmed)) continue;

      // If statement does not end with semicolon, flag CS1002
      if (!trimmed.endsWith(';')) {
        errors.push({
          code: 'CS1002',
          description: '; expected',
          file: 'Form1.cs',
          line: lineNumber
        });
      }
    }

    if (openBraces > 0) {
      errors.push({
        code: 'CS1513',
        description: "} expected (Missing closing brace)",
        file: 'Form1.cs',
        line: lines.length
      });
    }

    if (openParens !== 0) {
      errors.push({
        code: 'CS1026',
        description: ") expected (Mismatched parentheses)",
        file: 'Form1.cs',
        line: lines.length
      });
    }

    // Check for class Form1 definition
    if (!code.includes('class Form1') && !code.includes('Form1 : Form')) {
      errors.push({
        code: 'CS0246',
        description: "The type or namespace name 'Form1' could not be found",
        file: 'Form1.cs',
        line: 1
      });
    }

    return errors;
  }

  /**
   * Extract student variables, methods, and event handlers from Form1.cs
   */
  extractFormMembers(code) {
    // Find content inside class Form1 { ... }
    const classMatch = code.match(/class\s+Form1[^{]*\{([\s\S]*)\}\s*$/m) ||
                       code.match(/class\s+Form1[^{]*\{([\s\S]*)/m);
    if (!classMatch) {
      return { fields: [], methods: new Map() };
    }

    const classBody = classMatch[1];
    const methods = new Map();
    const fieldLines = [];

    // Parse methods: [private/public/protected] [static] [void/int/string/etc] MethodName(...) { ... }
    const methodRegex = /(?:public|private|protected|internal)?\s*(?:static)?\s*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
    const reservedKeywords = new Set(['if', 'else', 'while', 'for', 'foreach', 'switch', 'case', 'catch', 'finally', 'using', 'lock', 'return']);
    let match;

    while ((match = methodRegex.exec(classBody)) !== null) {
      const returnType = match[1];
      const methodName = match[2];
      if (reservedKeywords.has(methodName)) continue;

      const rawParams = match[3] || '';
      const params = rawParams
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => p.split(/\s+/).pop())
        .join(', ');
      const startIndex = match.index + match[0].length;

      // Extract body by tracking curly braces
      let braceDepth = 1;
      let bodyEnd = -1;
      for (let i = startIndex; i < classBody.length; i++) {
        if (classBody[i] === '{') braceDepth++;
        else if (classBody[i] === '}') {
          braceDepth--;
          if (braceDepth === 0) {
            bodyEnd = i;
            break;
          }
        }
      }

      if (bodyEnd !== -1) {
        const methodBody = classBody.substring(startIndex, bodyEnd);
        methods.set(methodName, {
          returnType,
          methodName,
          params,
          body: methodBody,
          fullMatch: match[0] + methodBody + '}'
        });
        // Advance regex past the extracted method body so inner if/while blocks aren't matched as methods
        methodRegex.lastIndex = bodyEnd + 1;
      }
    }

    // Collect class-level fields (e.g. `int count = 0;`, `string name = "test";`)
    // Remove all method bodies to isolate fields
    let fieldsOnly = classBody;
    for (const [_, m] of methods) {
      fieldsOnly = fieldsOnly.replace(m.fullMatch, '');
    }

    const rawFieldLines = fieldsOnly.split('\n');
    for (const rawLine of rawFieldLines) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
      if (trimmed.includes(';') && !trimmed.includes('(')) {
        fieldLines.push(trimmed);
      }
    }

    return { fieldLines, methods };
  }

  /**
   * Transpile C# code block to safe JavaScript
   */
  transpileCSharpToJS(csharpCode) {
    let js = csharpCode;

    // 1. Convert string interpolation: $"Hello {name}" -> `Hello ${name}`
    // Guard against literal "$" preceded by a quote, and don't match across newlines
    js = js.replace(/(?<!["\\])\$"([^"\r\n\\]*(?:\\.[^"\r\n\\]*)*)"/g, (match, content) => {
      return '`' + content.replace(/{([^}]+)}/g, '${$1}') + '`';
    });

    // 2. Convert standard C# types in variable declarations:
    // int x = 5; -> let x = 5;
    // string s = "hi"; -> let s = "hi";
    // double d = 1.2; -> let d = 1.2;
    // bool b = true; -> let b = true;
    // var v = ...; -> let v = ...;
    // Random rnd = new Random(); -> let rnd = new Random();
    js = js.replace(/\b(?:int|double|float|decimal|string|bool|var|char|long|short|byte|DateTime)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(=|;)/g, 'let $1 $2');

    // 3. Convert C# parsing and conversions:
    // int.Parse(...) -> parseInt(..., 10)
    // double.Parse(...) -> parseFloat(...)
    // Convert.ToInt32(...) -> Math.round(Number(...))
    // Convert.ToDouble(...) -> Number(...)
    // Convert.ToString(...) -> String(...)
    js = js.replace(/\bint\.Parse\s*\(/g, 'parseInt(');
    js = js.replace(/\bdouble\.Parse\s*\(/g, 'parseFloat(');
    js = js.replace(/\bfloat\.Parse\s*\(/g, 'parseFloat(');
    js = js.replace(/\bConvert\.ToInt32\s*\(/g, 'Math.round(Number(');
    js = js.replace(/\bConvert\.ToDouble\s*\(/g, 'Number(');
    js = js.replace(/\bConvert\.ToString\s*\(/g, 'String(');

    // 4. .ToString() -> .toString()
    js = js.replace(/\.ToString\s*\(\s*\)/g, '.toString()');

    // 5. MessageBox.Show(...) -> MessageBox.Show(...) [handled by runtime environment]
    // Console.WriteLine(...) -> Console.WriteLine(...) [handled by runtime environment]

    // 6. C# new Random()
    js = js.replace(/new\s+Random\s*\(\s*\)/g, 'new CSharpRandom()');

    return js;
  }

  /**
   * Initialize and run the application in the Running Application window
   */
  startApplication(formDefinition, csharpCode, runtimeContainer) {
    this.stopApplication(); // Clean up any previous timers
    this.activeTimers.clear();
    this.executionState = {};
    this.controls = {};

    const errors = this.validateCode(csharpCode, formDefinition);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const { fieldLines, methods } = this.extractFormMembers(csharpCode);

    // Build the live controls proxy
    runtimeContainer.innerHTML = '';
    const formProps = formDefinition.properties || {};
    runtimeContainer.style.backgroundColor = formProps.BackColor || '#f0f0f0';

    // Create runtime control wrappers
    for (const ctrl of (formDefinition.controls || [])) {
      const domElement = this.createRuntimeDOMControl(ctrl, runtimeContainer);
      const controlProxy = this.createControlProxy(ctrl, domElement);
      this.controls[ctrl.name] = controlProxy;
    }

    // Provide Form1 proxy (not stored in this.controls so 'this' is not passed as an illegal parameter)
    this.formProxy = {
      get Text() { return (formDefinition.properties && formDefinition.properties.Text) || 'Form1'; },
      set Text(val) {
        if (!formDefinition.properties) formDefinition.properties = {};
        formDefinition.properties.Text = String(val);
        const titleEl = document.getElementById('running-app-title');
        if (titleEl) titleEl.textContent = String(val);
      },
      get text() {
        throw new Error("'text' is not a valid property on Form. In C# property names are case-sensitive; please use '.Text'.");
      },
      set text(val) {
        throw new Error("'text' is not a valid property on Form. In C# property names are case-sensitive; please use '.Text'.");
      },
      get BackColor() { return runtimeContainer.style.backgroundColor; },
      set BackColor(val) { runtimeContainer.style.backgroundColor = val; },
      get backColor() { return this.BackColor; },
      set backColor(val) { this.BackColor = val; },
      Close() {
        this.ide.stopDebugging();
      },
      close() {
        this.Close();
      }
    };

    // Standard C# Environment Objects
    const environment = {
      MessageBox: {
        Show: (message, title = 'Application') => {
          this.ide.logOutput(`[MessageBox: ${title}] ${message}`, 'user-out');
          alert(`[${title}]\n\n${message}`);
        }
      },
      Console: {
        WriteLine: (...args) => {
          const str = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
          this.ide.logOutput(str, 'user-out');
        },
        Write: (...args) => {
          const str = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
          this.ide.logOutput(str, 'user-out');
        }
      },
      Math: Math,
      CSharpRandom: class {
        Next(min, max) {
          if (max === undefined) {
            max = min || 100;
            min = 0;
          }
          return Math.floor(Math.random() * (max - min)) + min;
        }
      }
    };

    // Build transpiled execution scope
    let transpileScript = `
      // Class Level Fields
    `;

    for (const field of fieldLines) {
      const transpiledField = this.transpileCSharpToJS(field);
      transpileScript += transpiledField + '\n';
    }

    // Expose all methods inside sandbox
    for (const [name, methodObj] of methods) {
      // Don't duplicate constructor
      if (name === 'Form1') continue;

      const transpiledBody = this.transpileCSharpToJS(methodObj.body);
      transpileScript += `
        function ${name}(${methodObj.params}) {
          try {
            ${transpiledBody}
          } catch(err) {
            Console.WriteLine("Runtime Error in ${name}: " + err.message);
          }
        }
        _scope['${name}'] = ${name};
      `;
    }

    // Execute setup script in scope
    try {
      const scopeObject = {};
      // Filter out reserved words or invalid identifiers
      const controlKeys = Object.keys(this.controls).filter(k => 
        k !== 'this' && k !== 'arguments' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)
      );
      const controlValues = controlKeys.map(k => this.controls[k]);

      const factory = new Function(
        'MessageBox', 'Console', 'Math', 'CSharpRandom', '_scope',
        ...controlKeys,
        transpileScript
      );

      factory.call(
        this.formProxy,
        environment.MessageBox,
        environment.Console,
        environment.Math,
        environment.CSharpRandom,
        scopeObject,
        ...controlValues
      );

      this.executionState.scope = scopeObject;

      // Wire up DOM and Component Events
      this.bindControlEvents(formDefinition.controls, scopeObject);

      // Trigger Form1_Load if defined
      if (typeof scopeObject['Form1_Load'] === 'function') {
        try {
          scopeObject['Form1_Load'].call(this.formProxy, this.formProxy, {});
        } catch (e) {
          this.ide.logOutput(`Error in Form1_Load: ${e.message}`, 'error');
        }
      }

      // Check if any Timer was configured with Enabled = true initially
      for (const ctrl of formDefinition.controls) {
        if (ctrl.type === 'Timer' && (ctrl.properties.Enabled === true || ctrl.properties.Enabled === 'True')) {
          if (this.controls[ctrl.name]) {
            this.controls[ctrl.name].start();
          }
        }
      }

      return { success: true };
    } catch (e) {
      return {
        success: false,
        errors: [{
          code: 'CS9999',
          description: e.message,
          file: 'Form1.cs',
          line: 1
        }]
      };
    }
  }

  /**
   * Create DOM elements for controls running interactively
   */
  createRuntimeDOMControl(ctrl, container) {
    if (ctrl.type === 'Timer') {
      // Timers don't have visual form elements
      return null;
    }

    const el = document.createElement('div');
    el.className = 'wf-control';
    el.id = `runtime-${ctrl.name}`;
    el.style.left = `${ctrl.x}px`;
    el.style.top = `${ctrl.y}px`;
    el.style.width = `${ctrl.width}px`;
    el.style.height = `${ctrl.height}px`;

    const props = ctrl.properties || {};
    if (props.BackColor) el.style.backgroundColor = props.BackColor;
    if (props.ForeColor) el.style.color = props.ForeColor;
    if (props.Font) el.style.fontFamily = props.Font;
    if (props.FontSize) el.style.fontSize = `${props.FontSize}pt`;
    if (props.Visible === false || props.Visible === 'False') {
      el.style.display = 'none';
    }

    switch (ctrl.type) {
      case 'Button': {
        const btn = document.createElement('button');
        btn.className = 'wf-btn';
        btn.style.width = '100%';
        btn.style.height = '100%';
        btn.textContent = ctrl.properties.Text || ctrl.name;
        if (ctrl.properties.Enabled === false || ctrl.properties.Enabled === 'False') {
          btn.disabled = true;
        }
        el.appendChild(btn);
        break;
      }

      case 'TextBox': {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'wf-txt';
        input.style.width = '100%';
        input.style.height = '100%';
        input.value = ctrl.properties.Text || '';
        if (ctrl.properties.Enabled === false || ctrl.properties.Enabled === 'False') {
          input.disabled = true;
        }
        el.appendChild(input);
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
        const select = document.createElement('select');
        select.className = 'wf-cmb-select';
        select.style.width = '100%';
        select.style.height = '100%';

        const items = ctrl.properties.Items || [];
        for (const it of items) {
          const opt = document.createElement('option');
          opt.value = it;
          opt.textContent = it;
          select.appendChild(opt);
        }
        if (ctrl.properties.Text) {
          select.value = ctrl.properties.Text;
        }
        el.appendChild(select);
        break;
      }

      case 'CheckBox': {
        const label = document.createElement('label');
        label.className = 'wf-chk';
        label.style.width = '100%';
        label.style.height = '100%';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '6px';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = ctrl.properties.Checked === true || ctrl.properties.Checked === 'True';
        const span = document.createElement('span');
        span.textContent = ctrl.properties.Text || ctrl.name;
        label.appendChild(chk);
        label.appendChild(span);
        el.appendChild(label);
        break;
      }

      case 'ListBox': {
        const lst = document.createElement('div');
        lst.className = 'wf-lst';
        lst.style.width = '100%';
        lst.style.height = '100%';
        const items = ctrl.properties.Items || [];
        for (const it of items) {
          const row = document.createElement('div');
          row.className = 'wf-lst-item';
          row.textContent = it;
          lst.appendChild(row);
        }
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

      default: {
        el.textContent = ctrl.name;
      }
    }

    container.appendChild(el);
    return el;
  }

  /**
   * Create reactive C# proxy for a control (label1.Text, textBox1.Text, timer1.Start(), etc.)
   */
  createControlProxy(ctrl, domElement) {
    const engine = this;
    const name = ctrl.name;

    if (ctrl.type === 'Timer') {
      let interval = parseInt(ctrl.properties.Interval || 1000, 10);
      let isEnabled = ctrl.properties.Enabled === true || ctrl.properties.Enabled === 'True';
      let timerId = null;

      const timerProxy = {
        get Interval() { return interval; },
        set Interval(val) {
          interval = parseInt(val, 10);
          if (isEnabled) {
            timerProxy.Stop();
            timerProxy.Start();
          }
        },
        get interval() { return this.Interval; },
        set interval(val) { this.Interval = val; },
        get Enabled() { return isEnabled; },
        set Enabled(val) {
          if (val) timerProxy.Start();
          else timerProxy.Stop();
        },
        get enabled() { return this.Enabled; },
        set enabled(val) { this.Enabled = val; },
        Start() {
          if (timerId) clearInterval(timerId);
          isEnabled = true;
          engine.ide.logOutput(`Timer '${name}' started (Interval: ${interval}ms)`, 'info');
          timerId = setInterval(() => {
            const handlerName = `${name}_Tick`;
            if (engine.executionState.scope && typeof engine.executionState.scope[handlerName] === 'function') {
              try {
                engine.executionState.scope[handlerName].call(engine.formProxy, timerProxy, {});
              } catch (e) {
                engine.ide.logOutput(`Error in ${handlerName}: ${e.message}`, 'error');
              }
            }
          }, interval);
          engine.activeTimers.set(name, timerId);
        },
        start() { this.Start(); },
        Stop() {
          isEnabled = false;
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
          engine.activeTimers.delete(name);
          engine.ide.logOutput(`Timer '${name}' stopped`, 'info');
        },
        stop() { this.Stop(); }
      };

      return timerProxy;
    }

    // Visual Controls
    const proxy = {
      get Text() {
        if (!domElement) return '';
        if (ctrl.type === 'TextBox') {
          const input = domElement.querySelector('input');
          return input ? input.value : '';
        }
        if (ctrl.type === 'Button') {
          const btn = domElement.querySelector('button');
          return btn ? btn.textContent : '';
        }
        if (ctrl.type === 'Label') {
          const lbl = domElement.querySelector('.wf-lbl');
          return lbl ? lbl.textContent : '';
        }
        if (ctrl.type === 'ComboBox') {
          const select = domElement.querySelector('select');
          return select ? select.value : '';
        }
        if (ctrl.type === 'CheckBox') {
          const span = domElement.querySelector('span');
          return span ? span.textContent : '';
        }
        return domElement.textContent;
      },
      set Text(val) {
        if (!domElement) return;
        const str = String(val);
        if (ctrl.type === 'TextBox') {
          const input = domElement.querySelector('input');
          if (input) input.value = str;
        } else if (ctrl.type === 'Button') {
          const btn = domElement.querySelector('button');
          if (btn) btn.textContent = str;
        } else if (ctrl.type === 'Label') {
          const lbl = domElement.querySelector('.wf-lbl');
          if (lbl) lbl.textContent = str;
        } else if (ctrl.type === 'ComboBox') {
          const select = domElement.querySelector('select');
          if (select) select.value = str;
        } else if (ctrl.type === 'CheckBox') {
          const span = domElement.querySelector('span');
          if (span) span.textContent = str;
        } else {
          domElement.textContent = str;
        }
      },
      get text() {
        throw new Error(`'text' is not defined on control '${name}'. In C# Windows Forms, the property is '.Text' (capitalized).`);
      },
      set text(val) {
        throw new Error(`'text' is not defined on control '${name}'. In C# Windows Forms, the property is '.Text' (capitalized).`);
      },
      get Enabled() {
        if (!domElement) return true;
        const input = domElement.querySelector('input, button, select');
        return input ? !input.disabled : true;
      },
      set Enabled(val) {
        if (!domElement) return;
        const input = domElement.querySelector('input, button, select');
        if (input) input.disabled = !val;
        if (val) domElement.classList.remove('disabled');
        else domElement.classList.add('disabled');
      },
      get enabled() { return this.Enabled; },
      set enabled(val) { this.Enabled = val; },
      get Visible() {
        return domElement ? domElement.style.display !== 'none' : false;
      },
      set Visible(val) {
        if (domElement) domElement.style.display = val ? '' : 'none';
      },
      get visible() { return this.Visible; },
      set visible(val) { this.Visible = val; },
      get BackColor() {
        return domElement ? domElement.style.backgroundColor : '';
      },
      set BackColor(val) {
        if (domElement) domElement.style.backgroundColor = val;
      },
      get backColor() { return this.BackColor; },
      set backColor(val) { this.BackColor = val; },
      get ForeColor() {
        return domElement ? domElement.style.color : '';
      },
      set ForeColor(val) {
        if (domElement) domElement.style.color = val;
      },
      get foreColor() { return this.ForeColor; },
      set foreColor(val) { this.ForeColor = val; },
      Focus() {
        if (!domElement) return;
        const input = domElement.querySelector('input, button, select');
        if (input) input.focus();
      },
      focus() { this.Focus(); }
    };

    // ComboBox Specific Items Proxy
    if (ctrl.type === 'ComboBox') {
      const select = domElement.querySelector('select');
      const itemsProxy = {
        Add(item) {
          if (!select) return;
          const opt = document.createElement('option');
          opt.value = item;
          opt.textContent = item;
          select.appendChild(opt);
        },
        add(item) { this.Add(item); },
        Clear() {
          if (select) select.innerHTML = '';
        },
        clear() { this.Clear(); },
        get Count() {
          return select ? select.options.length : 0;
        },
        get count() { return this.Count; }
      };
      proxy.Items = itemsProxy;
      proxy.items = itemsProxy;

      Object.defineProperty(proxy, 'SelectedItem', {
        get() { return select ? select.value : null; },
        set(val) { if (select) select.value = val; }
      });
      Object.defineProperty(proxy, 'selectedItem', {
        get() { return this.SelectedItem; },
        set(val) { this.SelectedItem = val; }
      });
      Object.defineProperty(proxy, 'SelectedIndex', {
        get() { return select ? select.selectedIndex : -1; },
        set(val) { if (select) select.selectedIndex = val; }
      });
      Object.defineProperty(proxy, 'selectedIndex', {
        get() { return this.SelectedIndex; },
        set(val) { this.SelectedIndex = val; }
      });
    }

    // CheckBox Specific Checked Proxy
    if (ctrl.type === 'CheckBox') {
      const chk = domElement.querySelector('input[type="checkbox"]');
      Object.defineProperty(proxy, 'Checked', {
        get() { return chk ? chk.checked : false; },
        set(val) { if (chk) chk.checked = !!val; }
      });
      Object.defineProperty(proxy, 'checked', {
        get() { return this.Checked; },
        set(val) { this.Checked = val; }
      });
    }

    return proxy;
  }

  /**
   * Wire DOM events (click, change, etc.) to student C# event handlers
   */
  bindControlEvents(controls, scopeObject) {
    for (const ctrl of controls) {
      const domEl = document.getElementById(`runtime-${ctrl.name}`);
      if (!domEl) continue;

      if (ctrl.type === 'Button') {
        const btn = domEl.querySelector('button');
        const clickHandlerName = `${ctrl.name}_Click`;
        if (btn && typeof scopeObject[clickHandlerName] === 'function') {
          btn.addEventListener('click', (e) => {
            scopeObject[clickHandlerName].call(this.formProxy, this.controls[ctrl.name], e);
          });
        }
      }

      if (ctrl.type === 'ComboBox') {
        const select = domEl.querySelector('select');
        const changeHandlerName = `${ctrl.name}_SelectedIndexChanged`;
        if (select && typeof scopeObject[changeHandlerName] === 'function') {
          select.addEventListener('change', (e) => {
            scopeObject[changeHandlerName].call(this.formProxy, this.controls[ctrl.name], e);
          });
        }
      }

      if (ctrl.type === 'TextBox') {
        const input = domEl.querySelector('input');
        const changeHandlerName = `${ctrl.name}_TextChanged`;
        if (input && typeof scopeObject[changeHandlerName] === 'function') {
          input.addEventListener('input', (e) => {
            scopeObject[changeHandlerName].call(this.formProxy, this.controls[ctrl.name], e);
          });
        }
      }

      if (ctrl.type === 'CheckBox') {
        const chk = domEl.querySelector('input[type="checkbox"]');
        const checkHandlerName = `${ctrl.name}_CheckedChanged`;
        if (chk && typeof scopeObject[checkHandlerName] === 'function') {
          chk.addEventListener('change', (e) => {
            scopeObject[checkHandlerName].call(this.formProxy, this.controls[ctrl.name], e);
          });
        }
      }
    }
  }

  /**
   * Stop all active application timers and cleanup
   */
  stopApplication() {
    for (const [name, timerId] of this.activeTimers) {
      clearInterval(timerId);
    }
    this.activeTimers.clear();
    this.executionState = {};
  }
}

window.CSharpEngine = CSharpEngine;
