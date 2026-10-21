


// #region Imports

import { basename      } from 'node:path';          // What: Base Name. Why: Plain-text configs and their boundaries are recognized by file name. How: This returns a path's last segment.
import { createRequire } from 'node:module';        // What: Create Require. Why: TypeScript has to come from the audited project, so its parser matches the project's own version. How: This builds a require function rooted at the project.
import { execFileSync  } from 'node:child_process'; // What: Exec File Sync. Why: Only the files git tracks are checked. How: This runs git ls-files in the project root and returns its output.
import { extname       } from 'node:path';          // What: Extension Name. Why: Most checks apply to one kind of file. How: This returns a path's extension, dot included.
import { join          } from 'node:path';          // What: Join. Why: Tracked paths are relative to the project root. How: This joins the root and a relative path.
import { readFileSync  } from 'node:fs';            // What: Read File Sync. Why: Every check reads a file's full text. How: This reads a file as UTF-8.
import { resolve       } from 'node:path';          // What: Resolve. Why: createRequire needs an absolute path, and the project may be given as a relative one. How: This turns the argument into an absolute path.
import { statSync      } from 'node:fs';            // What: Stat Sync. Why: A tracked entry can be a symlink to a folder, which has no text to check. How: This reads whether a path is a regular file.

// #endregion Imports



/**
 * check.ts = Mechanical Audit Checker
 *
 * @summary
 * Runs the scripted checks from "## Full Project Audits" in the user-level
 * CLAUDE.md against one project, so the same code always gives the same
 * answer: em dashes, file boundaries, trailing whitespace and space
 * indentation, quotes, parentheses spacing, import grouping and alignment,
 * exports at the end, JSON format, comment block widths, plain-text config
 * comments, CSS sibling regions closer than 3 blank lines, and test Hows that
 * never say what they check. Lint and type check run separately, through
 * run.ts.
 *
 * Run it as node ~/projects/claude-rules/audit/check.ts <project-root>. It
 * prints one finding per line as file:line: [check] message, then a count,
 * and exits with 1 when anything was found, or 2 when no project was given.
 * TypeScript is loaded from the project's own node_modules, so the parser
 * matches the project's version, and Node strips this file's own types, so
 * Node 23.6 or newer runs it directly.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type TyeNodTyp = import( 'typescript' ).Node; // What: TypeScript Node Type. Why: The syntax walk and the spacing check both take a parsed node. How: This names the parser's own node type, which Node strips at run time.

// #endregion Types



// #region Constants

const CLO_PAR_STR = '\u0029';                                                                          // What: Closing Parenthesis String. Why: The parenthesis matcher counts every parenthesis in a span of source text, strings included, so a literal one in this file's own strings would throw off its count when the checker reads itself. How: This holds the character as an escape, which reads the same at run time.
const COD_EXT_SET = new Set( [ '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs' ] );                       // What: Code Extension Set. Why: The TypeScript checks and the code file boundaries apply only to script files. How: This lists every script extension a project may use.
const IMP_KIN_ARR = [ 'default', 'named', 'type', 'side-effect' ];                                     // What: Import Kind Array. Why: Import findings name the groups involved. How: This lists each import group's name at the index impKinFun gives it.
const OPE_PAR_STR = '\u0028';                                                                          // What: Opening Parenthesis String. Why: The parenthesis matcher counts every parenthesis in a span of source text, strings included, so a literal one in this file's own strings would throw off its count when the checker reads itself. How: This holds the character as an escape, which reads the same at run time.
const PLA_NAM_SET = new Set( [ '_headers', '_redirects', 'robots.txt', '.gitignore' ] );               // What: Plain Name Set. Why: Plain-text config files have their own boundary and comment rules. How: This lists their file names.
const SKI_PAT_REG = /(^|\/)(package-lock\.json|.*\.(png|ico|woff2|jpg|jpeg|webp))$|(^|\/)baselines\//; // What: Skip Pattern RegExp. Why: Generated and binary files are exempt from every rule. How: This matches the lockfile, images, fonts, and screenshot baselines.

// #endregion Constants



// #region Module State

const rooDirStr = process.argv[ 2 ] ? resolve( process.argv[ 2 ] ) : ''; // What: Root Directory String. Why: Every check reads the project given on the command line. How: This resolves the first argument to an absolute path, or holds an empty string when none was given.


if ( !rooDirStr ) { // What: Usage Guard. Why: The checker has nothing to read without a project. How: This prints the usage line and exits with 2.


	console.error( 'usage: node check.ts <project-root>' ); // What: Usage Message Call. Why: The person running it should learn what it expects. How: This prints the usage line to standard error.

	process.exit( 2 ); // What: Usage Exit Call. Why: A missing argument is an error, distinct from a run that found something. How: This exits with 2.


}



const reqModFun = createRequire( join( rooDirStr, 'package.json' ) ); // What: Require Module Function. Why: TypeScript has to load from the audited project. How: This builds a require function that resolves packages from the project root.

const tyeModObj : typeof import( 'typescript' ) = reqModFun( 'typescript' ); // What: TypeScript Module Object. Why: The code checks parse each script with the project's own TypeScript. How: This loads the project's typescript package.

const conKinSet = new Set( [ tyeModObj.SyntaxKind.IfStatement, tyeModObj.SyntaxKind.WhileStatement, tyeModObj.SyntaxKind.ForStatement, tyeModObj.SyntaxKind.ForOfStatement, tyeModObj.SyntaxKind.ForInStatement, tyeModObj.SyntaxKind.SwitchStatement, tyeModObj.SyntaxKind.DoStatement ] ); // What: Condition Kind Set. Why: Every if, loop, and switch shares the condition spacing rule. How: This lists the syntax kinds that carry a parenthesized condition, read from the project's own TypeScript.



const gitOutStr = execFileSync( 'git', [ 'ls-files' ], { cwd : rooDirStr, encoding : 'utf8' } );                                                                       // What: Git Output String. Why: Only tracked files are checked, so ignored output never counts. How: This runs git ls-files in the project root.
const filLisArr = gitOutStr.split( '\n' ).filter( ( filPatStr ) => filPatStr && !SKI_PAT_REG.test( filPatStr ) && statSync( join( rooDirStr, filPatStr ) ).isFile() ); // What: File List Array. Why: Each check runs over the same set of files. How: This keeps every non-empty tracked path that isn't exempt and is a regular file.



type FinRecTyp = { // What: Finding Record Type. Why: Every check records its findings in the same shape. How: This names the check, the file, the line, and the message.


	cheStr : string, // What: Check String. Why: A finding names the check that raised it. How: This is the short label printed in brackets.
	filStr : string, // What: File String. Why: A finding points at its file. How: This is the path relative to the project root.
	linNum : number, // What: Line Number. Why: A finding points at its line. How: This is the 1-based line number.
	mesStr : string  // What: Message String. Why: A finding says what is wrong. How: This is the text printed after the label.


};

const finRecArr : FinRecTyp[] = []; // What: Finding Record Array. Why: Findings are printed together once every file is checked. How: Each check pushes its findings here through addFinFun.

// #endregion Module State



// #region Helpers

// #region Shared Helpers

// #region addFinFun

/**
 * addFinFun = Add Finding Function
 *
 * @summary
 * Records one finding for the final report. Every check calls it, so each
 * finding carries the same four fields, printed later as
 * file:line: [check] message in the order they were recorded.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param fouLinNum - Found Line Number: The 1-based line the finding is on.
 * @param cheNamStr - Check Name String: The check's short label.
 * @param mesTexStr - Message Text String: What is wrong.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * addFinFun('src/app.tsx', 12, 'quotes', 'double-quoted string "x"')
 * // => void
 * ```
 *
*/

function addFinFun ( filPatStr : string, fouLinNum : number, cheNamStr : string, mesTexStr : string ) : void {


	finRecArr.push( { cheStr : cheNamStr, filStr : filPatStr, linNum : fouLinNum, mesStr : mesTexStr } ); // What: Finding Push Call. Why: The report prints every finding at the end. How: This appends one finding record.


}

// #endregion addFinFun



// #region impKinFun

/**
 * impKinFun = Import Kind Function
 *
 * @summary
 * Sorts an import statement into its group under the import rules, as a
 * number the import checks compare: 0 for a default import, 1 for a named
 * import, 2 for a type import, and 3 for a side-effect import with no
 * binding. The groups have to appear in that order, so a lower number after
 * a higher one is out of place. IMP_KIN_ARR names each number.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param impDecObj - Import Declaration Object: The parsed import statement.
 *
 * @returns The import's group number, from 0 to 3.
 *
 * @example
 * ```ts
 * impKinFun(impDecObj) // => 1 for import { join } from 'node:path'
 * ```
 *
*/

function impKinFun ( impDecObj : import( 'typescript' ).ImportDeclaration ) : number {


	const impClaObj = impDecObj.importClause; // What: Import Clause Object. Why: The clause holds the bindings that decide the group. How: This reads it, which is missing for a side-effect import.


	if ( !impClaObj ) return 3; // What: Side-Effect Guard. Why: An import with no clause binds nothing. How: This returns the side-effect group.



	if ( impClaObj.isTypeOnly ) return 2; // What: Type Import Guard. Why: An import type statement forms the third group. How: This returns the type group.



	if ( impClaObj.namedBindings ) return 1; // What: Named Import Guard. Why: An import with braces forms the second group. How: This returns the named group.



	return 0; // What: Default Group Return. Why: Anything left binds a default export. How: This returns the default group.


}

// #endregion impKinFun



// #region isaSouFun

/**
 * isaSouFun = Is-A Source Function
 *
 * @summary
 * Whether a file's extension marks it as hand-written source under the file
 * boundary rules: a script, a stylesheet, or an HTML page. Those files start
 * with 3 blank lines and end with 2, are indented with tabs, and wrap their
 * block comments at 79 columns.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param extNamStr - Extension Name String: The file's extension, dot
 *                    included.
 *
 * @returns Whether the file is a script, a stylesheet, or an HTML page.
 * @see {@link souExtBoo}
 *
 * @example
 * ```ts
 * isaSouFun('.css') // => true
 * ```
 *
*/

function isaSouFun ( extNamStr : string ) : boolean {


	const codExtBoo = COD_EXT_SET.has( extNamStr ); // What: Code Extension Boolean. Why: Scripts are source. How: This checks the extension against the script list.
	const cssExtBoo = extNamStr === '.css';         // What: CSS Extension Boolean. Why: Stylesheets are source. How: This checks for the CSS extension.
	const htmExtBoo = extNamStr === '.html';        // What: HTML Extension Boolean. Why: HTML pages are source. How: This checks for the HTML extension.

	const souExtBoo = codExtBoo || cssExtBoo || htmExtBoo; // What: Source Extension Boolean. Why: Any one of the three makes the file source. How: This combines them.



	return souExtBoo; // What: Source Extension Return. Why: The caller decides which rules apply from this. How: This hands back the combined answer.


}

// #endregion isaSouFun



// #region linNumFun

/**
 * linNumFun = Line Number Function
 *
 * @summary
 * Turns a character position in a file's text into the 1-based line it sits
 * on, by counting the newlines before it. The regex checks find matches by
 * position, and a finding reports a line.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filTexStr - File Text String: The text the position points into.
 * @param chaPosNum - Character Position Number: The position to look up.
 *
 * @returns The 1-based line number of the position.
 * @see {@link linCouNum}
 *
 * @example
 * ```ts
 * linNumFun('a\nb', 2) // => 2
 * ```
 *
*/

function linNumFun ( filTexStr : string, chaPosNum : number ) : number {


	let linCouNum = 1; // What: Line Count Number. Why: Lines are numbered from 1. How: This starts at the first line and grows with each newline passed.


	for ( let chaIndNum = 0; chaIndNum < chaPosNum; chaIndNum++ ) if ( filTexStr.charCodeAt( chaIndNum ) === 10 ) linCouNum++; // What: Newline Count Loop. Why: Each newline before the position starts a new line. How: This walks every character before the position and counts the newlines.



	return linCouNum; // What: Line Count Return. Why: The caller reports this line. How: This hands back the count.


}

// #endregion linNumFun



// #region stiCssFun

/**
 * stiCssFun = Strip CSS Function
 *
 * @summary
 * Blanks out every comment in a stylesheet, so the quote and parenthesis
 * checks never read prose as CSS. Each comment character other than a
 * newline becomes a space, so every later match keeps its line number.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filTexStr - File Text String: The stylesheet's text.
 *
 * @returns The stylesheet's text with its comments blanked out.
 *
 * @example
 * ```ts
 * stiCssFun(cssTexStr) // => the text with every comment blanked
 * ```
 *
*/

function stiCssFun ( filTexStr : string ) : string {


	return filTexStr.replace( /\/\*[\s\S]*?\*\//g, ( matTexStr ) => matTexStr.replace( /[^\n]/g, ' ' ) ); // What: Blanked Text Return. Why: The CSS checks read only the rules. How: This replaces each comment's characters with spaces, keeping its newlines.


}

// #endregion stiCssFun

// #endregion Shared Helpers



// #region File Checks

// #region bouCheFun

/**
 * bouCheFun = Boundary Check Function
 *
 * @summary
 * Checks a file's first and last lines against the file boundary rules. A
 * script, stylesheet, or HTML page starts with exactly 3 blank lines and ends
 * with exactly 2, while a JSON, XML, or plain-text config file starts on its
 * first line and ends with exactly one newline. Any other file is skipped.
 * Each break is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * bouCheFun('src/app.tsx', filTexStr) // => void
 * ```
 *
*/

function bouCheFun ( filPatStr : string, filTexStr : string ) : void {


	const basNamStr = basename( filPatStr ); // What: Base Name String. Why: Plain-text configs are recognized by name. How: This reads the path's last segment.
	const extNamStr = extname( filPatStr );  // What: Extension Name String. Why: The boundary rules depend on the kind of file. How: This reads the path's extension.

	const jsoExtBoo = extNamStr === '.json';        // What: JSON Extension Boolean. Why: JSON files end with one newline. How: This checks for the JSON extension.
	const plaNamBoo = PLA_NAM_SET.has( basNamStr ); // What: Plain Name Boolean. Why: Plain-text configs end with one newline. How: This checks the name against the config list.
	const xmlExtBoo = extNamStr === '.xml';         // What: XML Extension Boolean. Why: XML files end with one newline. How: This checks for the XML extension.

	const oneNewBoo = jsoExtBoo || plaNamBoo || xmlExtBoo; // What: One Newline Boolean. Why: These files start on their first line and end with one newline. How: This combines the three kinds.


	if ( isaSouFun( extNamStr ) ) { // What: Source Boundary Branch. Why: Source files sit between 3 blank lines and 2. How: This checks both ends against those counts.


		if ( !/^\n\n\n[^\n]/.test( filTexStr ) ) addFinFun( filPatStr, 1, 'boundary', 'should start with exactly 3 blank lines' ); // What: Source Start Check. Why: A source file opens with exactly 3 blank lines. How: This records a finding on line 1 when it doesn't.



		if ( !/[^\n]\n\n\n$/.test( filTexStr ) ) addFinFun( filPatStr, linNumFun( filTexStr, filTexStr.length ), 'boundary', 'should end with exactly 2 blank lines' ); // What: Source End Check. Why: A source file closes with exactly 2 blank lines, which an editor's final newline makes 3. How: This records a finding on the last line when it doesn't.


	}

	else if ( oneNewBoo ) { // What: One Newline Boundary Branch. Why: JSON, XML, and plain-text configs have fixed boundaries their tools expect. How: This checks both ends for no leading blank and one trailing newline.


		if ( /^\s/.test( filTexStr ) ) addFinFun( filPatStr, 1, 'boundary', 'should start on its first line' ); // What: First Line Check. Why: These files start on their first line. How: This records a finding when the text opens with whitespace.



		if ( !/[^\n]\n$/.test( filTexStr ) ) addFinFun( filPatStr, linNumFun( filTexStr, filTexStr.length ), 'boundary', 'should end with exactly one newline' ); // What: One Newline Check. Why: These files end with exactly one newline. How: This records a finding on the last line when they don't.


	}


}

// #endregion bouCheFun



// #region codCheFun

/**
 * codCheFun = Code Check Function
 *
 * @summary
 * Parses a script with the project's own TypeScript and checks what the
 * parser can see: double-quoted strings without an apostrophe, parenthesis
 * spacing on calls, declarations, and control-flow conditions, the import
 * rules (one binding per statement, groups in order 2 blank lines apart,
 * names alphabetized, extensions on relative paths, and aligned from
 * keywords, braces, and comments), and the export rules (none inline, one
 * export statement on one line, at the very end). Any file that isn't a
 * script is skipped. Each break is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * codCheFun('src/app.tsx', filTexStr) // => void
 * ```
 *
*/

function codCheFun ( filPatStr : string, filTexStr : string ) : void {


	const extNamStr = extname( filPatStr ); // What: Extension Name String. Why: Only scripts are parsed, and JSX needs its own parser mode. How: This reads the path's extension.


	if ( !COD_EXT_SET.has( extNamStr ) ) return; // What: Script Guard. Why: Only scripts can be parsed as TypeScript. How: This skips any other file.



	// #region Source Parsing

	const scrKinNum = extNamStr === '.tsx' || extNamStr === '.jsx' ? tyeModObj.ScriptKind.TSX : tyeModObj.ScriptKind.TS;  // What: Script Kind Number. Why: JSX only parses in TSX mode. How: This picks TSX for a .tsx or .jsx file and TS for the rest.
	const souFilObj = tyeModObj.createSourceFile( filPatStr, filTexStr, tyeModObj.ScriptTarget.Latest, true, scrKinNum ); // What: Source File Object. Why: The checks walk the parsed syntax tree. How: This parses the text with parent links set, so each node can read its own source.
	const posLinFun = ( chaPosNum : number ) : number => souFilObj.getLineAndCharacterOfPosition( chaPosNum ).line + 1;   // What: Position Line Function. Why: A finding reports a 1-based line. How: This asks the parsed file for a position's line and adds 1.

	// #endregion Source Parsing



	// #region Syntax Walk

	// #region cloFinFun

	/**
	 * cloFinFun = Close Find Function
	 *
	 * @summary
	 * Finds the parenthesis that closes the one at a given position, by
	 * counting every opening and closing parenthesis after it in the raw
	 * text, strings and comments included. Returns -1 when the text ends
	 * first, which the spacing check then reads as no close found.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param opePosNum - Opening Position Number: The opening parenthesis's
	 *                    position.
	 *
	 * @returns The closing parenthesis's position, or -1 when there is none.
	 * @see {@link chaIndNum}
	 *
	 * @example
	 * ```ts
	 * cloFinFun(4) // => 9 for the text if ( x )
	 * ```
	 *
	*/

	function cloFinFun ( opePosNum : number ) : number {


		let depLevNum = 0; // What: Depth Level Number. Why: Nested parentheses have to close before the outer one does. How: This counts how many are open.


		for ( let chaIndNum = opePosNum; chaIndNum < filTexStr.length; chaIndNum++ ) { // What: Close Search Loop. Why: The close is somewhere after the opening. How: This walks each character from the opening onward.


			const curChaStr = filTexStr[ chaIndNum ]; // What: Current Character String. Why: Only parentheses change the depth. How: This reads the character at the loop's position.


			if ( curChaStr === OPE_PAR_STR ) depLevNum++; // What: Opening Depth Step. Why: Each opening parenthesis goes one level deeper. How: This raises the depth.

			else if ( curChaStr === CLO_PAR_STR && --depLevNum === 0 ) return chaIndNum; // What: Matching Close Return. Why: The close that brings the depth back to zero matches the opening. How: This lowers the depth and returns the position once it reaches zero.


		}



		return -1; // What: Missing Close Return. Why: The text can end before the opening closes. How: This returns -1 so the caller sees no close.


	}

	// #endregion cloFinFun



	const parFinFun = ( froPosNum : number ) : number => filTexStr.indexOf( OPE_PAR_STR, froPosNum ); // What: Parenthesis Find Function. Why: A call's or condition's opening parenthesis follows its name or keyword. How: This returns the first opening parenthesis at or after a position, or -1.



	// #region spaCheFun

	/**
	 * spaCheFun = Spacing Check Function
	 *
	 * @summary
	 * Checks a parenthesized list's inner spacing: the opening parenthesis is
	 * followed by a space or a newline, and the closing one is preceded by a
	 * space, a newline and its indentation, or another closing parenthesis,
	 * since stacked closing brackets stay tight. When the list's sole argument
	 * is a multi-line object literal, a brace may sit tight against either
	 * parenthesis instead. Each break is recorded as a finding labelled with
	 * the kind of list.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param opePosNum - Opening Position Number: The opening parenthesis's
	 *                    position.
	 * @param cloPosNum - Closing Position Number: {@link cloFinFun}
	 * @param solArgObj - Sole Argument Object: A call's only argument, or
	 *                    null for anything else.
	 * @param cheLabStr - Check Label String: The kind of list, which opens
	 *                    the finding's message.
	 *
	 * @returns This function does not return anything.
	 *
	 * @example
	 * ```ts
	 * spaCheFun(10, 24, null, 'condition') // => void
	 * ```
	 *
	*/

	function spaCheFun ( opePosNum : number, cloPosNum : number, solArgObj : TyeNodTyp | null, cheLabStr : string ) : void {


		const aftChaStr = filTexStr[ opePosNum + 1 ]; // What: After Character String. Why: The opening parenthesis needs room after it. How: This reads the character that follows it.
		const befChaStr = filTexStr[ cloPosNum - 1 ]; // What: Before Character String. Why: The closing parenthesis needs room before it. How: This reads the character that precedes it.
		const tigObjBoo = solArgObj && tyeModObj.isObjectLiteralExpression( solArgObj ) && posLinFun( solArgObj.getStart() ) !== posLinFun( solArgObj.end ); // What: Tight Object Boolean. Why: A call whose sole argument is a multi-line object literal keeps its braces tight against the parentheses. How: This checks for an object literal argument that spans more than one line.

		const aftNewBoo = aftChaStr === '\n';             // What: After Newline Boolean. Why: A list that wraps opens onto a new line. How: This checks for a newline after the opening.
		const aftSpaBoo = aftChaStr === ' ';              // What: After Space Boolean. Why: A one-line list opens with a space. How: This checks for a space after the opening.
		const aftTigBoo = tigObjBoo && aftChaStr === '{'; // What: After Tight Boolean. Why: A multi-line object argument's brace may sit tight. How: This checks for that brace right after the opening.

		const aftOkaBoo = aftNewBoo || aftSpaBoo || aftTigBoo; // What: After Okay Boolean. Why: Any one of these spaces the opening correctly. How: This combines them.


		if ( !aftOkaBoo ) addFinFun( filPatStr, posLinFun( opePosNum ), 'parens', `${ cheLabStr }: no space after ${ OPE_PAR_STR }` ); // What: Opening Space Check. Why: A non-empty list gets a space after its opening parenthesis. How: This records a finding when none of the allowed characters follows it.



		const befCloBoo = befChaStr === CLO_PAR_STR;                                                                   // What: Before Close Boolean. Why: A closing parenthesis may sit tight against another one. How: This checks for a closing parenthesis right before. // Stacked closing brackets stay tight, per the JSX stacked-bracket exception.
		const befNewBoo = /\n\t*$/.test( filTexStr.slice( filTexStr.lastIndexOf( '\n', cloPosNum - 1 ), cloPosNum ) ); // What: Before Newline Boolean. Why: A wrapped list closes on its own line. How: This checks that only a newline and tabs sit before the close on its line.
		const befSpaBoo = befChaStr === ' ';                                                                           // What: Before Space Boolean. Why: A one-line list closes with a space. How: This checks for a space before the close.
		const befTigBoo = tigObjBoo && befChaStr === '}';                                                              // What: Before Tight Boolean. Why: A multi-line object argument's brace may sit tight. How: This checks for that brace right before the close.

		const befOkaBoo = befSpaBoo || befCloBoo || befNewBoo || befTigBoo; // What: Before Okay Boolean. Why: Any one of these spaces the close correctly. How: This combines them.


		if ( !befOkaBoo ) addFinFun( filPatStr, posLinFun( cloPosNum ), 'parens', `${ cheLabStr }: no space before ${ CLO_PAR_STR }` ); // What: Closing Space Check. Why: A non-empty list gets a space before its closing parenthesis. How: This records a finding when none of the allowed characters precedes it.


	}

	// #endregion spaCheFun



	// #region visNodFun

	/**
	 * visNodFun = Visit Node Function
	 *
	 * @summary
	 * Checks one node of the syntax tree and then every node below it. A
	 * string literal is checked for double quotes without an apostrophe; a
	 * call or a new expression for a space before its parenthesis and for its
	 * inner spacing; a function, method, or arrow function for the space
	 * before its parameter list and that list's inner spacing; and an if,
	 * loop, switch, or catch binding for the space before its condition and
	 * the condition's inner spacing. Each break is recorded as a finding.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param curNodObj - Current Node Object: The node to check, starting
	 *                    from the parsed file.
	 *
	 * @returns This function does not return anything.
	 *
	 * @example
	 * ```ts
	 * visNodFun(souFilObj) // => void
	 * ```
	 *
	*/

	function visNodFun ( curNodObj : TyeNodTyp ) : void {


		if ( tyeModObj.isStringLiteral( curNodObj ) ) { // What: String Quote Branch. Why: A string uses single quotes unless its text holds an apostrophe. How: This checks each string literal's raw text.


			const rawTexStr = curNodObj.getText( souFilObj ); // What: Raw Text String. Why: Only the source shows which quote a string used. How: This reads the literal as written, quotes included.


			if ( rawTexStr.startsWith( '"' ) && !curNodObj.text.includes( "'" ) ) addFinFun( filPatStr, posLinFun( curNodObj.getStart() ), 'quotes', `double-quoted string ${ rawTexStr.slice( 0, 40 ) }` ); // What: Double Quote Check. Why: Double quotes are allowed only around an apostrophe. How: This records a finding for a double-quoted string without one.


		}



		const calNodBoo = tyeModObj.isCallExpression( curNodObj ) || tyeModObj.isNewExpression( curNodObj ); // What: Call Node Boolean. Why: Calls and new expressions share the call spacing rule. How: This checks for either kind of node.


		if ( calNodBoo && curNodObj.arguments ) { // What: Call Spacing Branch. Why: A call takes no space before its parenthesis and inner spaces unless empty. How: This checks a call or a new expression that has an argument list.


			const aftPosNum = curNodObj.typeArguments ? curNodObj.typeArguments.end + 1 : curNodObj.expression.end; // What: After Position Number. Why: The parenthesis follows the callee, or its type arguments when it has them. How: This reads where the callee or the closing angle bracket ends.
			const opePosNum = parFinFun( aftPosNum );                                                               // What: Opening Position Number. Why: The argument list starts at the first parenthesis after the callee. How: This finds it.


			if ( opePosNum >= 0 && opePosNum < curNodObj.end ) { // What: Found Parenthesis Branch. Why: A parenthesis past the call's own end belongs to other code. How: This checks only one found inside the call.


				const gapTexStr = filTexStr.slice( aftPosNum, opePosNum ); // What: Gap Text String. Why: Nothing may sit between a callee and its parenthesis. How: This reads the text between them.


				if ( /\s/.test( gapTexStr ) ) addFinFun( filPatStr, posLinFun( opePosNum ), 'parens', `call: space before ${ OPE_PAR_STR }` ); // What: Call Gap Check. Why: A call never takes a space before its parenthesis. How: This records a finding when the gap holds whitespace.



				const cloPosNum = cloFinFun( opePosNum ); // What: Closing Position Number. Why: The inner spacing check reads both ends. How: This finds the matching close.


				if ( curNodObj.arguments.length === 0 ) { // What: Empty Arguments Branch. Why: An empty argument list stays tight. How: This checks the close sits right after the opening.


					if ( cloPosNum !== opePosNum + 1 ) addFinFun( filPatStr, posLinFun( opePosNum ), 'parens', 'call: empty () should be tight' ); // What: Tight Empty Check. Why: An empty list has nothing to space. How: This records a finding when anything sits between the two.


				}

				else spaCheFun( opePosNum, cloPosNum, curNodObj.arguments.length === 1 ? curNodObj.arguments[ 0 ] : null, 'call' ); // What: Call Spacing Call. Why: A non-empty list gets inner spaces. How: This checks both ends, passing a sole argument so a multi-line object may sit tight.


			}


		}



		const arrFunBoo = tyeModObj.isArrowFunction( curNodObj );       // What: Arrow Function Boolean. Why: Arrow functions have a parameter list but no name before it. How: This checks for an arrow function.
		const funDecBoo = tyeModObj.isFunctionDeclaration( curNodObj ); // What: Function Declaration Boolean. Why: A function declaration has a parameter list. How: This checks for one.
		const funExpBoo = tyeModObj.isFunctionExpression( curNodObj );  // What: Function Expression Boolean. Why: A function expression has a parameter list. How: This checks for one.
		const metDecBoo = tyeModObj.isMethodDeclaration( curNodObj );   // What: Method Declaration Boolean. Why: A method has a parameter list. How: This checks for one.

		const funNodBoo = funDecBoo || funExpBoo || metDecBoo || arrFunBoo; // What: Function Node Boolean. Why: Every kind of function shares the declaration spacing rule. How: This combines them.


		if ( funNodBoo ) { // What: Declaration Spacing Branch. Why: A declaration takes a space before its parameter list, unless it's an arrow function, and inner spaces unless empty. How: This checks the parameter list of every kind of function.


			const parNodArr = curNodObj.parameters; // What: Parameter Node Array. Why: The list's position and length decide the checks. How: This reads the parsed parameters.
			const opePosNum = parNodArr.pos - 1;    // What: Opening Position Number. Why: The list's opening parenthesis sits just before its first parameter. How: This steps back one character from the list's start.


			if ( filTexStr[ opePosNum ] === OPE_PAR_STR ) { // What: Parenthesized List Branch. Why: A lone arrow parameter has no parentheses to check. How: This checks only a list that opens with one.


				const befTigBoo = filTexStr[ opePosNum - 1 ] !== ' '; // What: Before Tight Boolean. Why: A declaration's name or keyword takes a space before its list. How: This checks for a missing space.
				const nonGenBoo = !curNodObj.typeParameters;          // What: Non-Generic Boolean. Why: A generic's type parameters sit tight against its list. How: This checks the function has none.

				const misSpaBoo = !arrFunBoo && befTigBoo && nonGenBoo; // What: Missing Space Boolean. Why: Only a named, non-generic function is held to the space. How: This combines the three conditions.


				if ( misSpaBoo ) addFinFun( filPatStr, posLinFun( opePosNum ), 'parens', `declaration: no space before ${ OPE_PAR_STR }` ); // What: Declaration Space Check. Why: A space before the list marks a declaration, never a call. How: This records a finding when it's missing.



				const cloPosNum = cloFinFun( opePosNum ); // What: Closing Position Number. Why: The inner spacing check reads both ends. How: This finds the matching close.


				if ( parNodArr.length === 0 ) { // What: Empty Parameters Branch. Why: An empty parameter list stays tight. How: This checks the close sits right after the opening.


					if ( cloPosNum !== opePosNum + 1 ) addFinFun( filPatStr, posLinFun( opePosNum ), 'parens', 'declaration: empty () should be tight' ); // What: Tight Empty Check. Why: An empty list has nothing to space. How: This records a finding when anything sits between the two.


				}

				else spaCheFun( opePosNum, cloPosNum, null, 'declaration' ); // What: Declaration Spacing Call. Why: A non-empty list gets inner spaces. How: This checks both ends.


			}


		}



		const catBinBoo = tyeModObj.isCatchClause( curNodObj ) && Boolean( curNodObj.variableDeclaration ); // What: Catch Binding Boolean. Why: A catch with a binding has a parenthesized condition, while a bare catch has none. How: This checks for a catch clause with a binding.
		const conNodBoo = conKinSet.has( curNodObj.kind );                                                  // What: Condition Node Boolean. Why: Each if, loop, and switch has a parenthesized condition. How: This checks the node's kind against the condition kinds.


		if ( conNodBoo || catBinBoo ) { // What: Condition Spacing Branch. Why: A condition takes a space before its parenthesis and inner spaces. How: This checks every statement with a condition.


			const froPosNum = tyeModObj.isDoStatement( curNodObj ) ? curNodObj.statement.end : curNodObj.getStart(); // What: From Position Number. Why: A do loop's condition follows its body, while every other condition follows its keyword. How: This starts the search after a do loop's body, or at the statement's start.
			const opePosNum = parFinFun( froPosNum );                                                                // What: Opening Position Number. Why: The condition starts at the first parenthesis after that point. How: This finds it.


			if ( filTexStr[ opePosNum - 1 ] !== ' ' ) addFinFun( filPatStr, posLinFun( opePosNum ), 'parens', `condition: no space before ${ OPE_PAR_STR }` ); // What: Condition Space Check. Why: A keyword takes a space before its condition. How: This records a finding when it's missing.



			spaCheFun( opePosNum, cloFinFun( opePosNum ), null, 'condition' ); // What: Condition Spacing Call. Why: A condition gets inner spaces. How: This checks both ends.


		}



		tyeModObj.forEachChild( curNodObj, visNodFun ); // What: Child Walk Call. Why: Every node in the file gets the same checks. How: This visits each child node in turn.


	}

	// #endregion visNodFun



	visNodFun( souFilObj ); // What: Syntax Walk Call. Why: The quote and spacing checks cover the whole file. How: This starts the walk at the parsed file.

	// #endregion Syntax Walk



	// #region Import Checks

	const impDecArr = souFilObj.statements.filter( ( staNodObj ) => tyeModObj.isImportDeclaration( staNodObj ) ); // What: Import Declaration Array. Why: The import rules apply to every import statement. How: This keeps the file's top-level imports in order.


	if ( impDecArr.length ) { // What: Imports Branch. Why: A file without imports has nothing to check. How: This runs the import checks only when there are some.


		let preEndNum = -1; // What: Previous End Number. Why: The gap before an import is measured from the last one's end. How: This holds the previous import's last line.
		let preKinNum = -1; // What: Previous Kind Number. Why: Group order and gaps compare each import with the one before. How: This holds the previous import's group, or -1 before the first.
		let preNamStr = ''; // What: Previous Name String. Why: Names within a group are alphabetized. How: This holds the previous import's binding name.


		for ( const impDecObj of impDecArr ) { // What: Import Loop. Why: Each import is checked on its own and against the one before. How: This walks the imports in order.


			const impClaObj = impDecObj.importClause;                                                                             // What: Import Clause Object. Why: The clause holds the bindings. How: This reads it, which is missing for a side-effect import.
			const impKinNum = impKinFun( impDecObj );                                                                             // What: Import Kind Number. Why: Group order and gaps depend on the import's group. How: This reads its group number.
			const impLinNum = posLinFun( impDecObj.getStart() );                                                                  // What: Import Line Number. Why: Findings and gaps use the import's line. How: This reads the line it starts on.
			const namBinObj = impClaObj?.namedBindings;                                                                           // What: Named Bindings Object. Why: Braced and namespace bindings have their own rules. How: This reads them, when the import has any.
			const firEleStr = namBinObj && tyeModObj.isNamedImports( namBinObj ) ? namBinObj.elements[ 0 ]?.name.text ?? '' : ''; // What: First Element String. Why: A named import is alphabetized by its binding. How: This reads the first braced binding's name, or an empty string.
			const impNamStr = impClaObj?.name ? impClaObj.name.text : firEleStr;                                                  // What: Import Name String. Why: Imports are alphabetized by binding name. How: This reads the default binding's name, or the first braced one.
			const souPatStr = ( impDecObj.moduleSpecifier as import( 'typescript' ).StringLiteral ).text;                         // What: Source Path String. Why: A relative import names its file's extension. How: This reads the module the import comes from. // What: Type Assertion Note. Why: TypeScript types a module specifier as any expression. How: The parser only accepts a string literal there.


			if ( impClaObj && impClaObj.name && impClaObj.namedBindings ) addFinFun( filPatStr, impLinNum, 'imports', 'one binding per import statement' ); // What: Mixed Binding Check. Why: A default and a named binding in one statement are two bindings. How: This records a finding for an import with both.



			if ( namBinObj && tyeModObj.isNamedImports( namBinObj ) && namBinObj.elements.length !== 1 ) addFinFun( filPatStr, impLinNum, 'imports', 'one binding per import statement' ); // What: Braced Binding Check. Why: Each named import statement holds one binding. How: This records a finding for braces holding any other count.



			if ( namBinObj && tyeModObj.isNamespaceImport( namBinObj ) ) addFinFun( filPatStr, impLinNum, 'imports', 'namespace import has no rule (undefined case)' ); // What: Namespace Import Check. Why: No rule covers import * as, so it's raised with the user. How: This records a finding for a namespace import.



			if ( impClaObj && !impClaObj.isTypeOnly && namBinObj && tyeModObj.isNamedImports( namBinObj ) && namBinObj.elements.some( ( eleNodObj ) => eleNodObj.isTypeOnly ) ) addFinFun( filPatStr, impLinNum, 'imports', 'inline type import: use import type' ); // What: Inline Type Check. Why: A type is imported through import type, never an inline type inside braces. How: This records a finding for a braced binding marked type.



			if ( souPatStr.startsWith( '.' ) && !/\.[a-z0-9]+$/i.test( basename( souPatStr ) ) ) addFinFun( filPatStr, impLinNum, 'imports', `relative import without its extension: ${ souPatStr }` ); // What: Extension Check. Why: A relative import names its file's real extension. How: This records a finding for a relative path whose last segment has none.



			if ( preKinNum >= 0 ) { // What: Previous Import Branch. Why: The first import has nothing before it to compare with. How: This compares every later import with the one before.


				const gapCouNum = impLinNum - preEndNum - 1; // What: Gap Count Number. Why: Imports in a group sit together, and groups sit 2 blank lines apart. How: This counts the lines between the two imports.

				const notSidBoo = impKinNum !== 3;                                   // What: Not Side-Effect Boolean. Why: Side-effect imports keep their load order. How: This checks the import isn't one.
				const outOrdBoo = impNamStr.toLowerCase() < preNamStr.toLowerCase(); // What: Out Of Order Boolean. Why: Names within a group are alphabetized, ignoring case. How: This checks the name sorts before the previous one.
				const samKinBoo = impKinNum === preKinNum;                           // What: Same Kind Boolean. Why: Order and gaps differ within a group and between groups. How: This checks both imports share a group.

				const misOrdBoo = samKinBoo && notSidBoo && outOrdBoo; // What: Misordered Boolean. Why: Only a name out of order within a sorted group breaks the rule. How: This combines the three conditions.


				if ( impKinNum < preKinNum ) addFinFun( filPatStr, impLinNum, 'imports', `${ IMP_KIN_ARR[ impKinNum ] } import after a ${ IMP_KIN_ARR[ preKinNum ] } import` ); // What: Group Order Check. Why: The groups go default, named, type, then side-effect. How: This records a finding when an import's group comes earlier than the previous one's.

				else if ( samKinBoo && gapCouNum !== 0 ) addFinFun( filPatStr, impLinNum, 'imports', 'blank line inside an import group' ); // What: Group Gap Check. Why: Imports within a group sit on consecutive lines. How: This records a finding for any blank line between them.

				else if ( !samKinBoo && gapCouNum !== 2 ) addFinFun( filPatStr, impLinNum, 'imports', `${ gapCouNum } blank lines between import groups (want 2)` ); // What: Between Groups Check. Why: Groups sit 2 blank lines apart. How: This records a finding for any other gap.



				if ( misOrdBoo ) addFinFun( filPatStr, impLinNum, 'imports', `not alphabetical: ${ impNamStr } after ${ preNamStr }` ); // What: Alphabetical Check. Why: Names within a group are alphabetized. How: This records a finding for a name out of order.


			}



			preEndNum = posLinFun( impDecObj.end ); // What: Previous End Update. Why: The next gap is measured from this import. How: This stores its last line.
			preKinNum = impKinNum;                  // What: Previous Kind Update. Why: The next import is compared with this one's group. How: This stores its group.
			preNamStr = impNamStr;                  // What: Previous Name Update. Why: The next import is alphabetized against this one. How: This stores its binding name.


		}



		const linTexArr = filTexStr.split( '\n' ); // What: Line Text Array. Why: Alignment is measured on each import's line. How: This splits the file into lines.


		for ( let kinIndNum = 0; kinIndNum < 4; kinIndNum++ ) { // What: Group Alignment Loop. Why: Each group aligns its columns on its own. How: This visits the four groups in order.


			const groLinArr = impDecArr.filter( ( impDecObj ) => impKinFun( impDecObj ) === kinIndNum ).map( ( impDecObj ) => posLinFun( impDecObj.getStart() ) ); // What: Group Line Array. Why: Alignment compares the lines of one group. How: This lists the starting line of each import in the group.


			if ( groLinArr.length < 2 ) continue; // What: Single Import Guard. Why: One line has nothing to align with. How: This skips a group of fewer than two.



			const colSetFun = ( patMatReg : RegExp ) : Set< number > => new Set( groLinArr.map( ( impLinNum ) => linTexArr[ impLinNum - 1 ].replace( /\t/g, '    ' ).search( patMatReg ) ) ); // What: Column Set Function. Why: Aligned lines put a mark at the same column. How: This returns the set of columns a pattern first matches at across the group, counting tabs as 4.

			const namGroBoo = kinIndNum === 1;            // What: Named Group Boolean. Why: Braces only appear in the named and type groups. How: This checks for the named group.
			const typGroBoo = kinIndNum === 2;            // What: Type Group Boolean. Why: Braces only appear in the named and type groups. How: This checks for the type group.
			const braMisBoo = colSetFun( /\}/ ).size > 1; // What: Brace Misaligned Boolean. Why: A braced group lines up its closing braces. How: This checks for more than one brace column.

			const misBraBoo = ( namGroBoo || typGroBoo ) && braMisBoo; // What: Misaligned Braces Boolean. Why: Only a braced group is held to brace alignment. How: This combines the group and the columns.


			if ( kinIndNum !== 3 && colSetFun( / from '/ ).size > 1 ) addFinFun( filPatStr, groLinArr[ 0 ], 'imports', `${ IMP_KIN_ARR[ kinIndNum ] } group: from keywords not aligned` ); // What: From Alignment Check. Why: A group lines up its from keywords and source strings. How: This records a finding on the group's first line when they sit in more than one column.



			if ( misBraBoo ) addFinFun( filPatStr, groLinArr[ 0 ], 'imports', `${ IMP_KIN_ARR[ kinIndNum ] } group: closing braces not aligned` ); // What: Brace Alignment Check. Why: A braced group lines up its closing braces. How: This records a finding on the group's first line when they don't.



			if ( colSetFun( / \/\/ What:/ ).size > 1 ) addFinFun( filPatStr, groLinArr[ 0 ], 'imports', `${ IMP_KIN_ARR[ kinIndNum ] } group: comments not aligned` ); // What: Comment Alignment Check. Why: A group lines up its comments. How: This records a finding on the group's first line when they sit in more than one column.


		}


	}

	// #endregion Import Checks



	// #region Export Checks

	let lasNonNum = -1; // What: Last Non-Export Number. Why: Every export statement sits after the file's last other statement. How: This holds that statement's index.


	souFilObj.statements.forEach( ( staNodObj, staIndNum ) => { // What: Inline Export Walk. Why: Exports are made by name at the end, never on a declaration. How: This checks each top-level statement and tracks the last one that isn't an export.


		const modNodArr = tyeModObj.canHaveModifiers( staNodObj ) ? tyeModObj.getModifiers( staNodObj ) : undefined; // What: Modifier Node Array. Why: An inline export shows as an export modifier. How: This reads the statement's modifiers, when its kind can have any.


		if ( modNodArr?.some( ( modNodObj ) => modNodObj.kind === tyeModObj.SyntaxKind.ExportKeyword ) ) addFinFun( filPatStr, posLinFun( staNodObj.getStart() ), 'exports', 'inline export: export by name at the end of the file' ); // What: Inline Export Check. Why: Exports go in one statement at the end. How: This records a finding for a declaration marked export.



		if ( !tyeModObj.isExportDeclaration( staNodObj ) && !tyeModObj.isExportAssignment( staNodObj ) ) lasNonNum = staIndNum; // What: Last Statement Update. Why: Export statements are measured against the last other statement. How: This stores the index of each statement that isn't an export.


	} );



	souFilObj.statements.forEach( ( staNodObj, staIndNum ) => { // What: Export Position Walk. Why: Every export statement sits at the very end. How: This checks each export statement's place.


		const expAssBoo = tyeModObj.isExportAssignment( staNodObj );  // What: Export Assignment Boolean. Why: An export default sits at the end too. How: This checks for one.
		const expDecBoo = tyeModObj.isExportDeclaration( staNodObj ); // What: Export Declaration Boolean. Why: An export statement sits at the end. How: This checks for one.
		const earIndBoo = staIndNum < lasNonNum;                      // What: Early Index Boolean. Why: An export before another statement isn't at the end. How: This checks the statement comes before the last other one.

		const earExpBoo = ( expAssBoo || expDecBoo ) && earIndBoo; // What: Early Export Boolean. Why: Only an export placed early breaks the rule. How: This combines the kind and the place.


		if ( earExpBoo ) addFinFun( filPatStr, posLinFun( staNodObj.getStart() ), 'exports', 'export statement before other declarations' ); // What: Export Position Check. Why: Exports come after every declaration. How: This records a finding for an export placed early.


	} );



	const expDecArr = souFilObj.statements.filter( ( staNodObj ) => tyeModObj.isExportDeclaration( staNodObj ) ); // What: Export Declaration Array. Why: A file has at most one export statement, on one line. How: This lists its export statements.


	if ( expDecArr.length > 1 ) addFinFun( filPatStr, posLinFun( expDecArr[ 1 ].getStart() ), 'exports', 'more than one export { } statement' ); // What: Single Export Check. Why: Every plain named export shares one statement. How: This records a finding on the second one.



	for ( const expDecObj of expDecArr ) if ( posLinFun( expDecObj.getStart() ) !== posLinFun( expDecObj.end ) ) addFinFun( filPatStr, posLinFun( expDecObj.getStart() ), 'exports', 'export { } statement should be one line' ); // What: One Line Export Check. Why: The export statement stays on one line. How: This records a finding for each one that starts and ends on different lines.

	// #endregion Export Checks


}

// #endregion codCheFun



// #region cssCheFun

/**
 * cssCheFun = CSS Check Function
 *
 * @summary
 * Checks a stylesheet's quotes and parentheses, with its comments blanked
 * out first. A double-quoted string is allowed only when its text holds a
 * single quote, and every parenthesis in a function, query, or pseudo-class
 * takes an inner space unless it's empty. Single-quoted strings are blanked
 * before the parenthesis check, so a data URI's parentheses don't count. Any
 * file that isn't a stylesheet is skipped. Each break is recorded as a
 * finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * cssCheFun('src/styles/styles.css', filTexStr) // => void
 * ```
 *
*/

function cssCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( extname( filPatStr ) !== '.css' ) return; // What: Stylesheet Guard. Why: These rules read CSS. How: This skips any other file.



	const bodTexStr = stiCssFun( filTexStr );                                                                 // What: Body Text String. Why: Comments are prose, not CSS. How: This blanks them out, keeping line numbers.
	const sinBlaStr = bodTexStr.replace( /'[^'\n]*'/g, ( matTexStr ) => matTexStr.replace( /[^\n]/g, '_' ) ); // What: Single Blanked String. Why: A single-quoted string's text, such as a data URI, isn't checked. How: This replaces each one's characters with underscores, keeping line numbers.


	for ( const matResObj of sinBlaStr.matchAll( /"([^"\n]*)"/g ) ) { // What: Double Quote Loop. Why: Every remaining double-quoted string needs checking. How: This visits each one.


		if ( !matResObj[ 1 ].includes( "'" ) ) addFinFun( filPatStr, linNumFun( sinBlaStr, matResObj.index! ), 'quotes', `double-quoted CSS string ${ matResObj[ 0 ].slice( 0, 40 ) }` ); // What: Double Quote Check. Why: Double quotes are allowed only around a single quote. How: This records a finding for a string without one. // What: Non-Null Note. Why: TypeScript types a match's index as optional. How: matchAll always sets it.


	}



	for ( const matResObj of sinBlaStr.matchAll( /\((?![ \n)])|(?<![ \n(])\)/g ) ) { // What: Parenthesis Loop. Why: Every parenthesis needs an inner space unless the pair is empty. How: This visits each opening one not followed by a space, newline, or close, and each closing one not preceded by a space, newline, or opening, with single-quoted strings already blanked so a data URI's parentheses don't count.


		const matPosNum = matResObj.index!;                                                 // What: Match Position Number. Why: The finding reports the parenthesis's line and shows the text around it. How: This reads the match's position. // What: Non-Null Note. Why: TypeScript types a match's index as optional. How: matchAll always sets it.
		const neaTexStr = sinBlaStr.slice( Math.max( 0, matPosNum - 12 ), matPosNum + 12 ); // What: Near Text String. Why: A line can hold several parentheses, so the finding shows which one. How: This reads up to 12 characters on each side.


		addFinFun( filPatStr, linNumFun( sinBlaStr, matPosNum ), 'parens', `CSS parenthesis needs an inner space near ${ JSON.stringify( neaTexStr ) }` ); // What: Parenthesis Finding Call. Why: Each match breaks the spacing rule. How: This records a finding quoting the text around it.


	}


}

// #endregion cssCheFun



// #region emdCheFun

/**
 * emdCheFun = Em Dash Check Function
 *
 * @summary
 * Checks every line of any text file for an em dash in prose, which the Copy
 * rules forbid. Two uses are allowed and stripped first: a quote's
 * attribution, an em dash and a capitalized name ending the line, and a lone
 * placeholder glyph between quotes or tags. Each remaining em dash's line is
 * recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * emdCheFun('README.md', filTexStr) // => void
 * ```
 *
*/

function emdCheFun ( filPatStr : string, filTexStr : string ) : void {


	filTexStr.split( '\n' ).forEach( ( linTexStr, linIndNum ) => { // What: Em Dash Line Walk. Why: Each line is judged on its own. How: This visits every line with its index.


		if ( !linTexStr.includes( '\u2014' ) ) return; // What: No Dash Guard. Why: A line without an em dash has nothing to check. How: This skips it.



		const stiLinStr = linTexStr.replace( /\u2014\s+[A-Z][\w&' ]*["'<]?\s*$/, '' ).replace( /(['">])\u2014(['"<])/g, '$1$2' ); // What: Stripped Line String. Why: A quote's attribution and a lone placeholder glyph are allowed. How: This removes an em dash followed by a name at the line's end, and one standing alone between quotes or tags.


		if ( stiLinStr.includes( '\u2014' ) ) addFinFun( filPatStr, linIndNum + 1, 'em-dash', 'em dash in prose' ); // What: Em Dash Check. Why: Prose never uses an em dash. How: This records a finding when one survives the stripping.


	} );


}

// #endregion emdCheFun



// #region howCheFun

/**
 * howCheFun = How Check Function
 *
 * @summary
 * Checks that every test in a spec file says in its comment's How what it
 * asserts: the How names something the test checks, waits for, confirms,
 * compares, or fails on. A How that only says what a test measures leaves
 * its pass condition unstated. Any file that isn't a spec is skipped, and
 * each test line whose How names no check is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * howCheFun('tests/seo/head.spec.ts', filTexStr) // => void
 * ```
 *
*/

function howCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( !filPatStr.endsWith( '.spec.ts' ) ) return; // What: Spec Guard. Why: Only spec files declare tests. How: This skips any other file.



	filTexStr.split( '\n' ).forEach( ( linTexStr, linIndNum ) => { // What: Test Line Walk. Why: Each test is declared on its own line. How: This visits every line with its index.


		if ( !/^\s*test\x28/.test( linTexStr ) ) return; // What: Test Line Guard. Why: Only a test's own line carries its How. How: This skips any line that doesn't open a test call, matching the parenthesis by its escape so the checker's own parenthesis matcher reads this file correctly.



		const howTexStr = ( linTexStr.match( /How: (.*)$/ ) || [ '', '' ] )[ 1 ]; // What: How Text String. Why: Only the How names what a test asserts. How: This reads the text after How:, or an empty string when there is none.


		if ( !/\b(check|wait|confirm|compare|fail)/i.test( howTexStr ) ) addFinFun( filPatStr, linIndNum + 1, 'test-how', "the test's How never says what it checks" ); // What: Check Word Check. Why: A test's How names the assertions its test makes. How: This records a finding when it names no check, wait, confirmation, comparison, or failure.


	} );


}

// #endregion howCheFun



// #region htmCheFun

/**
 * htmCheFun = HTML Check Function
 *
 * @summary
 * Checks an HTML page's attribute values for double quotes, allowed only
 * when the value holds a single quote. The contents of script and style
 * elements and every HTML comment are blanked out first, since a JSON-LD
 * block stays valid JSON and inline styles and scripts follow their own
 * languages. Any file that isn't an HTML page is skipped. Each break is
 * recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * htmCheFun('index.html', filTexStr) // => void
 * ```
 *
*/

function htmCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( extname( filPatStr ) !== '.html' ) return; // What: HTML Guard. Why: These rules read HTML. How: This skips any other file.



	const scrBlaStr = filTexStr.replace( /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/g, ( matTexStr, opeTagStr, tagNamStr, conTexStr, cloTagStr ) => opeTagStr + conTexStr.replace( /[^\n]/g, ' ' ) + cloTagStr ); // What: Script Blanked String. Why: JSON-LD stays valid JSON, and inline styles and scripts follow their own languages. How: This blanks each script or style element's contents, keeping its tags and newlines, and leaves the whole match and the tag name unread.
	const bodTexStr = scrBlaStr.replace( /<!--[\s\S]*?-->/g, ( matTexStr ) => matTexStr.replace( /[^\n]/g, ' ' ) );                                                                                                 // What: Body Text String. Why: Comments are prose, not markup. How: This blanks each comment, keeping its newlines.


	for ( const matResObj of bodTexStr.matchAll( /=\s*"([^"]*)"/g ) ) { // What: Attribute Quote Loop. Why: Every double-quoted attribute value needs checking. How: This visits each one.


		if ( !matResObj[ 1 ].includes( "'" ) ) addFinFun( filPatStr, linNumFun( bodTexStr, matResObj.index! ), 'quotes', `double-quoted attribute ${ matResObj[ 0 ].slice( 0, 40 ) }` ); // What: Attribute Quote Check. Why: Double quotes are allowed only around a single quote. How: This records a finding for a value without one. // What: Non-Null Note. Why: TypeScript types a match's index as optional. How: matchAll always sets it.


	}


}

// #endregion htmCheFun



// #region jsoCheFun

/**
 * jsoCheFun = JSON Check Function
 *
 * @summary
 * Checks a JSON file or web app manifest against the JSON rules: the text
 * has to match exactly what JSON.stringify writes with tab indentation, plus
 * one newline, so a tool that rewrites it never churns it. A file that
 * doesn't parse is recorded too. Any other file is skipped.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * jsoCheFun('package.json', filTexStr) // => void
 * ```
 *
*/

function jsoCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( extname( filPatStr ) !== '.json' && !filPatStr.endsWith( '.webmanifest' ) ) return; // What: JSON Guard. Why: These rules read JSON. How: This skips anything but a JSON file or a manifest.



	try { // What: Parse Attempt. Why: A file that doesn't parse can't be compared. How: This compares the reserialized text, and the catch records a parse failure.


		if ( filTexStr !== JSON.stringify( JSON.parse( filTexStr ), null, '\t' ) + '\n' ) addFinFun( filPatStr, 1, 'json', 'does not match JSON.stringify( value, null, tab ) plus one newline' ); // What: Format Check. Why: A JSON file matches its serializer's output exactly. How: This records a finding when parsing and reserializing changes the text.


	}

	catch { addFinFun( filPatStr, 1, 'json', 'does not parse' ); } // What: Parse Failure Handler. Why: A file that doesn't parse breaks the rule outright. How: This records a finding on line 1.


}

// #endregion jsoCheFun



// #region plaCheFun

/**
 * plaCheFun = Plain-Text Check Function
 *
 * @summary
 * Checks a plain-text config file, such as _headers, _redirects, robots.txt,
 * or .gitignore, for a comment trailing a value, which these formats would
 * read as part of the value. Any other file is skipped, and each value line
 * with a trailing comment is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * plaCheFun('public/_headers', filTexStr) // => void
 * ```
 *
*/

function plaCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( !PLA_NAM_SET.has( basename( filPatStr ) ) ) return; // What: Plain-Text Guard. Why: These rules read plain-text configs. How: This skips any other file.



	filTexStr.split( '\n' ).forEach( ( linTexStr, linIndNum ) => { // What: Config Line Walk. Why: Each line is judged on its own. How: This visits every line with its index.


		if ( /^[^#\s].*\s#\s/.test( linTexStr ) ) addFinFun( filPatStr, linIndNum + 1, 'plain-text', 'trailing comment on a value line' ); // What: Trailing Comment Check. Why: A comment is a # line of its own, never trailing a value. How: This records a finding for a value line holding a # comment.


	} );


}

// #endregion plaCheFun



// #region regCheFun

/**
 * regCheFun = Region Check Function
 *
 * @summary
 * Checks a stylesheet for sibling regions closer than the CSS spacing rule
 * allows: an #endregion followed straight by a #region closes one sibling
 * and opens the next, and the two sit exactly 3 blank lines apart. Stacked
 * #endregion markers are left alone. Any file that isn't a stylesheet is
 * skipped, and each wrong gap is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * regCheFun('src/pages/home/about.module.css', filTexStr) // => void
 * ```
 *
*/

function regCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( extname( filPatStr ) !== '.css' ) return; // What: Stylesheet Guard. Why: This rule reads CSS regions. How: This skips any other file.



	const linTexArr = filTexStr.split( '\n' ); // What: Line Text Array. Why: The gap after a marker is counted line by line. How: This splits the file into lines.


	linTexArr.forEach( ( linTexStr, linIndNum ) => { // What: Region Line Walk. Why: Each #endregion marker may start a gap. How: This visits every line with its index.


		if ( !linTexStr.includes( '#endregion' ) ) return; // What: End Marker Guard. Why: Only a closing marker can sit before a sibling. How: This skips any other line.



		let nexIndNum = linIndNum + 1; // What: Next Index Number. Why: The gap ends at the next line with content. How: This starts at the line after the marker.


		while ( nexIndNum < linTexArr.length && linTexArr[ nexIndNum ].trim() === '' ) nexIndNum++; // What: Blank Line Skip Loop. Why: The gap is every blank line after the marker. How: This steps past them.



		const gapCouNum = nexIndNum - linIndNum - 1; // What: Gap Count Number. Why: Sibling regions sit exactly 3 blank lines apart. How: This counts the blank lines skipped.


		if ( nexIndNum < linTexArr.length && /#region/.test( linTexArr[ nexIndNum ] ) && !linTexArr[ nexIndNum ].includes( '#endregion' ) && gapCouNum !== 3 ) addFinFun( filPatStr, linIndNum + 1, 'regions', `${ gapCouNum } blank lines between sibling regions (want 3)` ); // What: Sibling Gap Check. Why: An #endregion followed straight by a #region closes one sibling and opens the next. How: This records a finding when the next content line opens a region at any gap but 3, its operands staying inline since each guards the next.


	} );


}

// #endregion regCheFun



// #region whiCheFun

/**
 * whiCheFun = Whitespace Check Function
 *
 * @summary
 * Checks every line of a file for trailing whitespace, and every line of a
 * script, stylesheet, or HTML page for indentation with spaces, since
 * indentation uses tabs. A space after the tabs is allowed only before a
 * block comment's star column. Each break is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * whiCheFun('src/app.tsx', filTexStr) // => void
 * ```
 *
*/

function whiCheFun ( filPatStr : string, filTexStr : string ) : void {


	const extNamStr = extname( filPatStr );   // What: Extension Name String. Why: Markdown keeps its trailing spaces, and only source is held to tabs. How: This reads the path's extension.
	const souFilBoo = isaSouFun( extNamStr ); // What: Source File Boolean. Why: Only source files are indented with tabs. How: This checks for a script, stylesheet, or HTML page.


	filTexStr.split( '\n' ).forEach( ( linTexStr, linIndNum ) => { // What: Whitespace Line Walk. Why: Each line is judged on its own. How: This visits every line with its index.


		if ( /[ \t]+$/.test( linTexStr ) && extNamStr !== '.md' ) addFinFun( filPatStr, linIndNum + 1, 'whitespace', 'trailing whitespace' ); // What: Trailing Whitespace Check. Why: No line ends in spaces or tabs. How: This records a finding for one that does, outside Markdown.



		if ( souFilBoo && /^\t* +\S/.test( linTexStr ) && !/^\t* +\*/.test( linTexStr ) ) addFinFun( filPatStr, linIndNum + 1, 'indent', 'indented with spaces, not tabs' ); // What: Space Indent Check. Why: Source is indented with tabs. How: This records a finding for a line whose indentation holds spaces, unless they lead to a block comment's star column.


	} );


}

// #endregion whiCheFun



// #region widCheFun

/**
 * widCheFun = Width Check Function
 *
 * @summary
 * Checks the block comments in a script, stylesheet, or HTML page: a JSDoc
 * or HTML comment block opened on its own line stays within 79 columns,
 * counting tabs as 4, and its blank lines carry no trailing space after the
 * star. Any other file is skipped. Each break is recorded as a finding.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filPatStr - File Path String: The file's path relative to the
 *                    project root.
 * @param filTexStr - File Text String: The file's full text.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * widCheFun('src/app.tsx', filTexStr) // => void
 * ```
 *
*/

function widCheFun ( filPatStr : string, filTexStr : string ) : void {


	if ( !isaSouFun( extname( filPatStr ) ) ) return; // What: Source Guard. Why: Only source files hold these comment blocks. How: This skips any other file.



	let insBloBoo = false; // What: Inside Block Boolean. Why: Only lines inside a block comment are measured. How: This turns on at a block's opening line and off at its close.


	filTexStr.split( '\n' ).forEach( ( linTexStr, linIndNum ) => { // What: Comment Line Walk. Why: Each line inside a block is judged on its own. How: This visits every line with its index.


		const opeBloBoo = /^\s*(\/\*\*|<!--)\s*$/.test( linTexStr ); // What: Opening Block Boolean. Why: A block opened on its own line starts the measured span. How: This checks for a lone JSDoc or HTML comment opening.


		if ( opeBloBoo ) insBloBoo = true; // What: Block Start. Why: The opening line and everything after it are inside the block. How: This turns the flag on.



		if ( insBloBoo && linTexStr.replace( /\t/g, '    ' ).length > 79 ) addFinFun( filPatStr, linIndNum + 1, 'width', 'block comment line past 79 columns' ); // What: Width Check. Why: A comment block wraps before column 80. How: This records a finding for a line past 79 columns, counting tabs as 4.



		if ( insBloBoo && /^\s*(\*\/|-->)\s*$/.test( linTexStr ) ) insBloBoo = false; // What: Block End. Why: The close ends the measured span. How: This turns the flag off at a lone close.



		if ( insBloBoo && /^\s*\* $/.test( linTexStr ) ) addFinFun( filPatStr, linIndNum + 1, 'width', 'blank block comment line has a trailing space' ); // What: Blank Star Check. Why: A blank line inside a block is a bare star. How: This records a finding for one followed by a space.


	} );


}

// #endregion widCheFun

// #endregion File Checks

// #endregion Helpers



// #region Module Init

for ( const filPatStr of filLisArr ) { // What: File Loop. Why: Every check runs on every tracked file. How: This reads each file and runs the checks in a fixed order, so findings print in the same order every run.


	const filTexStr = readFileSync( join( rooDirStr, filPatStr ), 'utf8' ); // What: File Text String. Why: Every check reads the file's text. How: This reads it as UTF-8.


	emdCheFun( filPatStr, filTexStr ); // What: Em Dash Check Call. Why: The Copy rules cover every file, Markdown and SVG included. How: This checks the file for em dashes.



	if ( extname( filPatStr ) === '.svg' || extname( filPatStr ) === '.md' ) continue; // What: Exempt Kind Guard. Why: An exported SVG stays as exported, and Markdown has no formatting rules. How: This skips the remaining checks for both.



	bouCheFun( filPatStr, filTexStr ); // What: Boundary Check Call. Why: Files open and close at fixed blank-line counts. How: This checks both ends.
	whiCheFun( filPatStr, filTexStr ); // What: Whitespace Check Call. Why: Lines carry no trailing whitespace and source is indented with tabs. How: This checks every line.
	widCheFun( filPatStr, filTexStr ); // What: Width Check Call. Why: Comment blocks wrap at 79 columns. How: This checks every block comment line.
	jsoCheFun( filPatStr, filTexStr ); // What: JSON Check Call. Why: JSON matches its serializer's output. How: This checks JSON files and manifests.
	cssCheFun( filPatStr, filTexStr ); // What: CSS Check Call. Why: Stylesheets follow the quote and parenthesis rules. How: This checks stylesheets.
	htmCheFun( filPatStr, filTexStr ); // What: HTML Check Call. Why: Attribute values follow the quote rule. How: This checks HTML pages.
	codCheFun( filPatStr, filTexStr ); // What: Code Check Call. Why: Scripts follow the quote, parenthesis, import, and export rules. How: This parses and checks scripts.
	plaCheFun( filPatStr, filTexStr ); // What: Plain-Text Check Call. Why: Config comments sit on lines of their own. How: This checks plain-text configs.
	howCheFun( filPatStr, filTexStr ); // What: How Check Call. Why: A test's How names what it asserts. How: This checks spec files.
	regCheFun( filPatStr, filTexStr ); // What: Region Check Call. Why: Sibling CSS regions sit 3 blank lines apart. How: This checks stylesheets.


}



for ( const finRecObj of finRecArr ) console.log( `${ finRecObj.filStr }:${ finRecObj.linNum }: [${ finRecObj.cheStr }] ${ finRecObj.mesStr }` ); // What: Finding Print Loop. Why: The audit reads one finding per line. How: This prints each as file:line: [check] message, in the order found.



console.log( `${ finRecArr.length } finding(s) in ${ filLisArr.length } files` ); // What: Count Print Call. Why: A clean run is confirmed at a glance. How: This prints the number of findings and files.

process.exit( finRecArr.length ? 1 : 0 ); // What: Result Exit Call. Why: A wrapper such as run.ts reads the result from the exit code. How: This exits with 1 when anything was found and 0 otherwise.

// #endregion Module Init


