// check.ts = Mechanical Audit Checker
//
// Runs the scripted checks from "## Full Project Audits" in the user-level
// CLAUDE.md against one project, so the same code always gives the same
// answer: em dashes, file boundaries, trailing whitespace and space
// indentation, quotes, parentheses spacing, import grouping and alignment,
// exports at the end, JSON format, comment block widths, plain-text config
// boundaries, CSS sibling regions closer than 3 blank lines, and test Hows
// that never say what they check. Lint and type check run separately (see
// run.sh).
//
// Usage: node ~/projects/claude-rules/audit/check.ts <project-root>
// Prints one finding per line as `file:line: [check] message`, then a count,
// and exits 1 when anything was found. TypeScript is loaded from the
// project's own node_modules, so the parser matches the project's version.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, extname, basename, resolve } from 'node:path';

const rooDirStr = process.argv[ 2 ] ? resolve( process.argv[ 2 ] ) : '';

if ( !rooDirStr ) { console.error( 'usage: node check.ts <project-root>' ); process.exit( 2 ); }

const reqModFun = createRequire( join( rooDirStr, 'package.json' ) );
const ts        = reqModFun( 'typescript' );

type FinRecTyp = { filStr : string; linNum : number; cheStr : string; mesStr : string };

const FIN_REC_ARR : FinRecTyp[] = [];

function addFinFun ( filStr : string, linNum : number, cheStr : string, mesStr : string ) : void {

	FIN_REC_ARR.push( { filStr, linNum, cheStr, mesStr } );

}

// Tracked files, minus generated or binary ones every rule exempts.
const SKI_PAT_REG = /(^|\/)(package-lock\.json|.*\.(png|ico|woff2|jpg|jpeg|webp))$|(^|\/)baselines\//;
const filLisArr   = execFileSync( 'git', [ 'ls-files' ], { cwd : rooDirStr, encoding : 'utf8' } ).split( '\n' ).filter( ( filStr ) => filStr && !SKI_PAT_REG.test( filStr ) && statSync( join( rooDirStr, filStr ) ).isFile() );

const CODE_EXT_SET  = new Set( [ '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs' ] );
const PLAIN_NAM_SET = new Set( [ '_headers', '_redirects', 'robots.txt', '.gitignore' ] );

function linNumFun ( texStr : string, posNum : number ) : number {

	let linNum = 1;

	for ( let ind = 0; ind < posNum; ind++ ) if ( texStr.charCodeAt( ind ) === 10 ) linNum++;

	return linNum;

}

// ---------- em dashes (every text file) ----------
function emdCheFun ( filStr : string, texStr : string ) : void {

	texStr.split( '\n' ).forEach( ( linStr, ind ) => {

		if ( !linStr.includes( '—' ) ) return;

		// A quote's attribution ("— Name") and a lone placeholder glyph are allowed.
		const strLinStr = linStr.replace( /—\s+[A-Z][\w&' ]*["'<]?\s*$/, '' ).replace( /(['">])—(['"<])/g, '$1$2' );

		if ( strLinStr.includes( '—' ) ) addFinFun( filStr, ind + 1, 'em-dash', 'em dash in prose' );

	} );

}

// ---------- file boundaries ----------
function bouCheFun ( filStr : string, texStr : string ) : void {

	const extStr = extname( filStr );
	const namStr = basename( filStr );

	if ( CODE_EXT_SET.has( extStr ) || extStr === '.css' || extStr === '.html' ) {

		if ( !/^\n\n\n[^\n]/.test( texStr ) ) addFinFun( filStr, 1, 'boundary', 'should start with exactly 3 blank lines' );

		if ( !/[^\n]\n\n\n$/.test( texStr ) ) addFinFun( filStr, linNumFun( texStr, texStr.length ), 'boundary', 'should end with exactly 2 blank lines' );

	}

	else if ( extStr === '.json' || PLAIN_NAM_SET.has( namStr ) || extStr === '.xml' ) {

		if ( /^\s/.test( texStr ) ) addFinFun( filStr, 1, 'boundary', 'should start on its first line' );

		if ( !/[^\n]\n$/.test( texStr ) ) addFinFun( filStr, linNumFun( texStr, texStr.length ), 'boundary', 'should end with exactly one newline' );

	}

}

// ---------- whitespace ----------
function whiCheFun ( filStr : string, texStr : string ) : void {

	const extStr = extname( filStr );
	const codBoo = CODE_EXT_SET.has( extStr ) || extStr === '.css' || extStr === '.html';

	texStr.split( '\n' ).forEach( ( linStr, ind ) => {

		if ( /[ \t]+$/.test( linStr ) && extStr !== '.md' ) addFinFun( filStr, ind + 1, 'whitespace', 'trailing whitespace' );

		// A space before the first character is allowed only for a block comment's * column.
		if ( codBoo && /^\t* +\S/.test( linStr ) && !/^\t* +\*/.test( linStr ) ) addFinFun( filStr, ind + 1, 'indent', 'indented with spaces, not tabs' );

	} );

}

// ---------- block comment widths (79 columns, tabs as 4) ----------
function widCheFun ( filStr : string, texStr : string ) : void {

	const extStr = extname( filStr );

	if ( !( CODE_EXT_SET.has( extStr ) || extStr === '.css' || extStr === '.html' ) ) return;

	let insBoo = false;

	texStr.split( '\n' ).forEach( ( linStr, ind ) => {

		const opeBoo = /^\s*(\/\*\*|<!--)\s*$/.test( linStr );

		if ( opeBoo ) insBoo = true;

		if ( insBoo && linStr.replace( /\t/g, '    ' ).length > 79 ) addFinFun( filStr, ind + 1, 'width', 'block comment line past 79 columns' );

		if ( insBoo && /^\s*(\*\/|-->)\s*$/.test( linStr ) ) insBoo = false;

		if ( insBoo && /^\s*\* $/.test( linStr ) ) addFinFun( filStr, ind + 1, 'width', 'blank block comment line has a trailing space' );

	} );

}

// ---------- JSON ----------
function jsoCheFun ( filStr : string, texStr : string ) : void {

	if ( extname( filStr ) !== '.json' && !filStr.endsWith( '.webmanifest' ) ) return;

	try {

		if ( texStr !== JSON.stringify( JSON.parse( texStr ), null, '\t' ) + '\n' ) addFinFun( filStr, 1, 'json', 'does not match JSON.stringify( value, null, tab ) plus one newline' );

	}

	catch { addFinFun( filStr, 1, 'json', 'does not parse' ); }

}

// ---------- CSS quotes and parentheses ----------
function strCssFun ( texStr : string ) : string {

	// Blank out comments, keeping newlines so line numbers hold.
	return texStr.replace( /\/\*[\s\S]*?\*\//g, ( matStr ) => matStr.replace( /[^\n]/g, ' ' ) );

}

function cssCheFun ( filStr : string, texStr : string ) : void {

	if ( extname( filStr ) !== '.css' ) return;

	const bodStr = strCssFun( texStr );
	const sinStr = bodStr.replace( /'[^'\n]*'/g, ( matStr ) => matStr.replace( /[^\n]/g, '_' ) );

	// Double-quoted strings are allowed only when their text holds a single quote.
	for ( const matObj of sinStr.matchAll( /"([^"\n]*)"/g ) ) {

		if ( !matObj[ 1 ].includes( "'" ) ) addFinFun( filStr, linNumFun( sinStr, matObj.index! ), 'quotes', `double-quoted CSS string ${ matObj[ 0 ].slice( 0, 40 ) }` );

	}

	// Single-quoted strings are blanked out, so a data URI's parentheses don't count.
	const nosStr = sinStr;

	for ( const matObj of nosStr.matchAll( /\((?![ \n)])|(?<![ \n(])\)/g ) ) {

		addFinFun( filStr, linNumFun( nosStr, matObj.index! ), 'parens', `CSS parenthesis needs an inner space near ${ JSON.stringify( nosStr.slice( Math.max( 0, matObj.index! - 12 ), matObj.index! + 12 ) ) }` );

	}

}

// ---------- HTML attribute quotes ----------
function htmCheFun ( filStr : string, texStr : string ) : void {

	if ( extname( filStr ) !== '.html' ) return;

	// JSON-LD stays valid JSON, and inline styles and scripts follow their own languages.
	const bodStr = texStr.replace( /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/g, ( _matStr, opeStr, _tagStr, conStr, cloStr ) => opeStr + conStr.replace( /[^\n]/g, ' ' ) + cloStr ).replace( /<!--[\s\S]*?-->/g, ( matStr ) => matStr.replace( /[^\n]/g, ' ' ) );

	for ( const matObj of bodStr.matchAll( /=\s*"([^"]*)"/g ) ) {

		if ( !matObj[ 1 ].includes( "'" ) ) addFinFun( filStr, linNumFun( bodStr, matObj.index! ), 'quotes', `double-quoted attribute ${ matObj[ 0 ].slice( 0, 40 ) }` );

	}

}

// ---------- TypeScript: quotes, parentheses, imports, exports ----------
function tsxCheFun ( filStr : string, texStr : string ) : void {

	const extStr = extname( filStr );

	if ( !CODE_EXT_SET.has( extStr ) ) return;

	const kinNum = extStr === '.tsx' || extStr === '.jsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
	const souObj = ts.createSourceFile( filStr, texStr, ts.ScriptTarget.Latest, true, kinNum );
	const linFun = ( posNum : number ) : number => souObj.getLineAndCharacterOfPosition( posNum ).line + 1;

	// A list's inner spacing: open must be followed by a space or newline, close preceded by one.
	function spaCheFun ( opePos : number, cloPos : number, solObj : any, labStr : string ) : void {

		const aftStr = texStr[ opePos + 1 ];
		const befStr = texStr[ cloPos - 1 ];
		const tigBoo = solObj && ts.isObjectLiteralExpression( solObj ) && linFun( solObj.getStart() ) !== linFun( solObj.end );

		if ( !( aftStr === ' ' || aftStr === '\n' || ( tigBoo && aftStr === '{' ) ) ) addFinFun( filStr, linFun( opePos ), 'parens', `${ labStr }: no space after (` );

		// Stacked closing brackets stay tight, per the JSX stacked-bracket exception.
		if ( !( befStr === ' ' || befStr === ')' || /\n\t*$/.test( texStr.slice( texStr.lastIndexOf( '\n', cloPos - 1 ), cloPos ) ) || ( tigBoo && befStr === '}' ) ) ) addFinFun( filStr, linFun( cloPos ), 'parens', `${ labStr }: no space before )` );

	}

	function parFinFun ( fromPos : number ) : number { return texStr.indexOf( '(', fromPos ); }

	function cloFinFun ( opePos : number ) : number {

		let deeNum = 0;

		for ( let ind = opePos; ind < texStr.length; ind++ ) {

			const chaStr = texStr[ ind ];

			if ( chaStr === '(' ) deeNum++;

			else if ( chaStr === ')' && --deeNum === 0 ) return ind;

		}

		return -1;

	}

	function visFun ( nodObj : any ) : void {

		// Quotes: a double-quoted string is allowed only when its text holds an apostrophe.
		if ( ( ts.isStringLiteral( nodObj ) || ts.isJsxText?.( nodObj ) === false ) && ts.isStringLiteral( nodObj ) ) {

			const rawStr = nodObj.getText( souObj );

			if ( rawStr.startsWith( '"' ) && !nodObj.text.includes( "'" ) ) addFinFun( filStr, linFun( nodObj.getStart() ), 'quotes', `double-quoted string ${ rawStr.slice( 0, 40 ) }` );

		}

		// Calls: no space before (, inner spaces unless empty.
		if ( ( ts.isCallExpression( nodObj ) || ts.isNewExpression( nodObj ) ) && nodObj.arguments ) {

			const aftPos = ( nodObj.typeArguments ? nodObj.typeArguments.end + 1 : nodObj.expression.end );
			const opePos = parFinFun( aftPos );

			if ( opePos >= 0 && opePos < nodObj.end ) {

				const gapStr = texStr.slice( aftPos, opePos );

				if ( /\s/.test( gapStr ) ) addFinFun( filStr, linFun( opePos ), 'parens', 'call: space before (' );

				const cloPos = cloFinFun( opePos );

				if ( nodObj.arguments.length === 0 ) {

					if ( cloPos !== opePos + 1 ) addFinFun( filStr, linFun( opePos ), 'parens', 'call: empty () should be tight' );

				}

				else spaCheFun( opePos, cloPos, nodObj.arguments.length === 1 ? nodObj.arguments[ 0 ] : null, 'call' );

			}

		}

		// Declarations: a space before ( after a name or the function keyword, inner spaces unless empty.
		if ( ts.isFunctionDeclaration( nodObj ) || ts.isFunctionExpression( nodObj ) || ts.isMethodDeclaration( nodObj ) || ts.isArrowFunction( nodObj ) ) {

			const parArr = nodObj.parameters;
			const opePos = parArr.pos - 1;

			if ( texStr[ opePos ] === '(' ) {

				if ( !ts.isArrowFunction( nodObj ) && texStr[ opePos - 1 ] !== ' ' && !nodObj.typeParameters ) addFinFun( filStr, linFun( opePos ), 'parens', 'declaration: no space before (' );

				const cloPos = cloFinFun( opePos );

				if ( parArr.length === 0 ) {

					if ( cloPos !== opePos + 1 ) addFinFun( filStr, linFun( opePos ), 'parens', 'declaration: empty () should be tight' );

				}

				else spaCheFun( opePos, cloPos, null, 'declaration' );

			}

		}

		// Control flow conditions.
		if ( ts.isIfStatement( nodObj ) || ts.isWhileStatement( nodObj ) || ts.isForStatement( nodObj ) || ts.isForOfStatement( nodObj ) || ts.isForInStatement( nodObj ) || ts.isSwitchStatement( nodObj ) || ts.isDoStatement( nodObj ) || ( ts.isCatchClause( nodObj ) && nodObj.variableDeclaration ) ) {

			const froPos = ts.isDoStatement( nodObj ) ? nodObj.statement.end : nodObj.getStart();
			const opePos = parFinFun( froPos );

			if ( texStr[ opePos - 1 ] !== ' ' ) addFinFun( filStr, linFun( opePos ), 'parens', 'condition: no space before (' );

			spaCheFun( opePos, cloFinFun( opePos ), null, 'condition' );

		}

		ts.forEachChild( nodObj, visFun );

	}

	visFun( souObj );

	// Imports.
	const impArr = souObj.statements.filter( ( staObj : any ) => ts.isImportDeclaration( staObj ) );

	if ( impArr.length ) {

		const kinFun = ( impObj : any ) : number => {

			const claObj = impObj.importClause;

			if ( !claObj ) return 3;

			if ( claObj.isTypeOnly ) return 2;

			if ( claObj.namedBindings ) return 1;

			return 0;

		};

		const NAM_ARR = [ 'default', 'named', 'type', 'side-effect' ];

		let preKin = -1;
		let preEnd = -1;
		let preNam = '';

		for ( const impObj of impArr ) {

			const kinNum2 = kinFun( impObj );
			const claObj  = impObj.importClause;
			const linNum  = linFun( impObj.getStart() );
			const souStr  = impObj.moduleSpecifier.text;

			if ( claObj && claObj.name && claObj.namedBindings ) addFinFun( filStr, linNum, 'imports', 'one binding per import statement' );

			if ( claObj && claObj.namedBindings && ts.isNamedImports( claObj.namedBindings ) && claObj.namedBindings.elements.length !== 1 ) addFinFun( filStr, linNum, 'imports', 'one binding per import statement' );

			if ( claObj && claObj.namedBindings && ts.isNamespaceImport( claObj.namedBindings ) ) addFinFun( filStr, linNum, 'imports', 'namespace import has no rule (undefined case)' );

			if ( claObj && !claObj.isTypeOnly && claObj.namedBindings && ts.isNamedImports( claObj.namedBindings ) && claObj.namedBindings.elements.some( ( eleObj : any ) => eleObj.isTypeOnly ) ) addFinFun( filStr, linNum, 'imports', 'inline type import: use import type' );

			if ( souStr.startsWith( '.' ) && !/\.[a-z0-9]+$/i.test( basename( souStr ) ) ) addFinFun( filStr, linNum, 'imports', `relative import without its extension: ${ souStr }` );

			const namStr = claObj ? ( claObj.name ? claObj.name.text : claObj.namedBindings?.elements?.[ 0 ]?.name.text ?? '' ) : '';

			if ( preKin >= 0 ) {

				const gapNum = linNum - preEnd - 1;

				if ( kinNum2 < preKin ) addFinFun( filStr, linNum, 'imports', `${ NAM_ARR[ kinNum2 ] } import after a ${ NAM_ARR[ preKin ] } import` );

				else if ( kinNum2 === preKin && gapNum !== 0 ) addFinFun( filStr, linNum, 'imports', 'blank line inside an import group' );

				else if ( kinNum2 !== preKin && gapNum !== 2 ) addFinFun( filStr, linNum, 'imports', `${ gapNum } blank lines between import groups (want 2)` );

				if ( kinNum2 === preKin && kinNum2 !== 3 && namStr.toLowerCase() < preNam.toLowerCase() ) addFinFun( filStr, linNum, 'imports', `not alphabetical: ${ namStr } after ${ preNam }` );

			}

			preKin = kinNum2;
			preEnd = linFun( impObj.end );
			preNam = namStr;

		}

		// Alignment within each group: from, the source string, and the comment.
		const lines = texStr.split( '\n' );

		for ( let kinNum3 = 0; kinNum3 < 4; kinNum3++ ) {

			const groArr = impArr.filter( ( impObj : any ) => kinFun( impObj ) === kinNum3 ).map( ( impObj : any ) => linFun( impObj.getStart() ) );

			if ( groArr.length < 2 ) continue;

			const colFun = ( patReg : RegExp ) => new Set( groArr.map( ( linNum : number ) => lines[ linNum - 1 ].replace( /\t/g, '    ' ).search( patReg ) ) );

			if ( kinNum3 !== 3 && colFun( / from '/ ).size > 1 ) addFinFun( filStr, groArr[ 0 ], 'imports', `${ NAM_ARR[ kinNum3 ] } group: from keywords not aligned` );

			if ( ( kinNum3 === 1 || kinNum3 === 2 ) && colFun( /\}/ ).size > 1 ) addFinFun( filStr, groArr[ 0 ], 'imports', `${ NAM_ARR[ kinNum3 ] } group: closing braces not aligned` );

			if ( colFun( / \/\/ What:/ ).size > 1 ) addFinFun( filStr, groArr[ 0 ], 'imports', `${ NAM_ARR[ kinNum3 ] } group: comments not aligned` );

		}

	}

	// Exports: none inline, and every export statement at the very end.
	let lasNon = -1;

	souObj.statements.forEach( ( staObj : any, ind : number ) => {

		const modArr = ts.canHaveModifiers?.( staObj ) ? ts.getModifiers( staObj ) : staObj.modifiers;

		if ( modArr?.some( ( modObj : any ) => modObj.kind === ts.SyntaxKind.ExportKeyword ) ) addFinFun( filStr, linFun( staObj.getStart() ), 'exports', 'inline export: export by name at the end of the file' );

		if ( !ts.isExportDeclaration( staObj ) && !ts.isExportAssignment( staObj ) ) lasNon = ind;

	} );

	const expArr = souObj.statements.filter( ( staObj : any ) => ts.isExportDeclaration( staObj ) );

	souObj.statements.forEach( ( staObj : any, ind : number ) => {

		if ( ( ts.isExportDeclaration( staObj ) || ts.isExportAssignment( staObj ) ) && ind < lasNon ) addFinFun( filStr, linFun( staObj.getStart() ), 'exports', 'export statement before other declarations' );

	} );

	if ( expArr.length > 1 ) addFinFun( filStr, linFun( expArr[ 1 ].getStart() ), 'exports', 'more than one export { } statement' );

	for ( const expObj of expArr ) if ( linFun( expObj.getStart() ) !== linFun( expObj.end ) ) addFinFun( filStr, linFun( expObj.getStart() ), 'exports', 'export { } statement should be one line' );

}

// ---------- plain-text config comments ----------
function plaCheFun ( filStr : string, texStr : string ) : void {

	if ( !PLAIN_NAM_SET.has( basename( filStr ) ) ) return;

	texStr.split( '\n' ).forEach( ( linStr, ind ) => {

		// A comment is a # line of its own, never trailing a value.
		if ( /^[^#\s].*\s#\s/.test( linStr ) ) addFinFun( filStr, ind + 1, 'plain-text', 'trailing comment on a value line' );

	} );

}

// ---------- CSS sibling regions sit 3 blank lines apart ----------
function regCheFun ( filStr : string, texStr : string ) : void {

	if ( extname( filStr ) !== '.css' ) return;

	const linArr = texStr.split( '\n' );

	linArr.forEach( ( linStr, ind ) => {

		// An #endregion followed straight by a #region closes one sibling and opens the next.
		if ( !linStr.includes( '#endregion' ) ) return;

		let nexInd = ind + 1;

		while ( nexInd < linArr.length && linArr[ nexInd ].trim() === '' ) nexInd++;

		const gapNum = nexInd - ind - 1;

		if ( nexInd < linArr.length && /#region/.test( linArr[ nexInd ] ) && !linArr[ nexInd ].includes( '#endregion' ) && gapNum !== 3 ) addFinFun( filStr, ind + 1, 'regions', `${ gapNum } blank lines between sibling regions (want 3)` );

	} );

}

// ---------- test Hows name a check ----------
function howCheFun ( filStr : string, texStr : string ) : void {

	if ( !filStr.endsWith( '.spec.ts' ) ) return;

	texStr.split( '\n' ).forEach( ( linStr, ind ) => {

		// A test's How names what it asserts, so it says what it checks, waits for, or compares.
		if ( !/^\s*test\(/.test( linStr ) ) return;

		const howStr = ( linStr.match( /How: (.*)$/ ) || [ '', '' ] )[ 1 ];

		if ( !/\b(check|wait|confirm|compare|fail)/i.test( howStr ) ) addFinFun( filStr, ind + 1, 'test-how', 'the test\'s How never says what it checks' );

	} );

}

for ( const filStr of filLisArr ) {

	const texStr = readFileSync( join( rooDirStr, filStr ), 'utf8' );

	emdCheFun( filStr, texStr );

	if ( extname( filStr ) === '.svg' || extname( filStr ) === '.md' ) continue;

	bouCheFun( filStr, texStr );
	whiCheFun( filStr, texStr );
	widCheFun( filStr, texStr );
	jsoCheFun( filStr, texStr );
	cssCheFun( filStr, texStr );
	htmCheFun( filStr, texStr );
	tsxCheFun( filStr, texStr );
	plaCheFun( filStr, texStr );
	howCheFun( filStr, texStr );
	regCheFun( filStr, texStr );

}

for ( const finObj of FIN_REC_ARR ) console.log( `${ finObj.filStr }:${ finObj.linNum }: [${ finObj.cheStr }] ${ finObj.mesStr }` );

console.log( `${ FIN_REC_ARR.length } finding(s) in ${ filLisArr.length } files` );

process.exit( FIN_REC_ARR.length ? 1 : 0 );
