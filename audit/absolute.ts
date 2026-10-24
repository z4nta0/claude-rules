


// #region Imports

import { execFileSync } from 'node:child_process'; // What: Exec File Sync. Why: Only the comments git tracks are listed. How: This runs git ls-files in the project root and returns its output.
import { extname      } from 'node:path';          // What: Extension Name. Why: A file's kind decides which comment markers it uses. How: This returns a path's extension.
import { join         } from 'node:path';          // What: Join. Why: Each tracked path is relative to the project root. How: This joins the root and a path into one.
import { readFileSync } from 'node:fs';            // What: Read File Sync. Why: Every comment is read from its file's text. How: This reads a file as UTF-8.
import { resolve      } from 'node:path';          // What: Resolve. Why: The project may be given as a relative path. How: This turns the argument into an absolute path.
import { statSync     } from 'node:fs';            // What: Stat Sync. Why: Only regular files hold comments. How: This reads a path's file information.

// #endregion Imports



/**
 * absolute.ts = Absolute Word Lister
 *
 * @summary
 * Lists every comment in a project that holds an absolute word (every, all,
 * only, always, never, exactly, or any), for the comments audit's dedicated
 * pass under "Comment accuracy" in CLAUDE.md, which checks each one against
 * its code at once. It reads the files git tracks, finds the comment text on
 * each line by the markers its kind of file uses, and prints one line per
 * word found, with the words around it, then the count. It's a list for a
 * reader rather than a check, so it exits with 0 whatever it finds, and with
 * 2 when no project was given.
 *
 * Run it as node ~/projects/claude-rules/audit/absolute.ts <project-root>.
 * Node strips this file's own types, so Node 23.6 or newer runs it directly.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const ABS_WOR_REG = /\b(every|all|only|always|never|exactly|any)\b/gi;                                // What: Absolute Word RegExp. Why: These are the words the accuracy rule asks to be proven in view. How: This matches each one as a whole word, in any case.
const COD_EXT_SET = new Set( [ '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs' ] );                       // What: Code Extension Set. Why: Only script files use line comments. How: This lists every script extension a project may use.
const CON_WID_NUM = 60;                                                                                // What: Context Width Number. Why: Each word is printed with enough around it to judge, without the whole long comment. How: This is how many characters to show on each side.
const PLA_NAM_SET = new Set( [ '_headers', '_redirects', 'robots.txt', '.gitignore' ] );               // What: Plain Name Set. Why: Plain-text config files comment with a hash at the start of a line. How: This lists their file names.
const SKI_PAT_REG = /(^|\/)(package-lock\.json|.*\.(png|ico|woff2|jpg|jpeg|webp|json|md))$|(^|\/)baselines\//; // What: Skip Pattern RegExp. Why: Data, binary, and prose files hold no code comments. How: This matches the lockfile, JSON, Markdown, images, fonts, and screenshot baselines.

// #endregion Constants



// #region Module State

const rooDirStr = process.argv[ 2 ] ? resolve( process.argv[ 2 ] ) : ''; // What: Root Directory String. Why: The list covers the project given on the command line. How: This resolves the first argument to an absolute path, or holds an empty string when none was given.


if ( !rooDirStr ) { // What: Usage Guard. Why: There's nothing to list without a project. How: This prints the usage line and exits with 2.


	console.error( 'usage: node absolute.ts <project-root>' ); // What: Usage Message Call. Why: The person running it should learn what it expects. How: This prints the usage line to standard error.

	process.exit( 2 ); // What: Usage Exit Call. Why: A missing argument is an error, distinct from a list. How: This exits with 2.


}



const gitOutStr = execFileSync( 'git', [ 'ls-files' ], { cwd : rooDirStr, encoding : 'utf8' } );                                                                       // What: Git Output String. Why: Only tracked files are listed, so ignored output never counts. How: This runs git ls-files in the project root.
const filLisArr = gitOutStr.split( '\n' ).filter( ( filPatStr ) => filPatStr && !SKI_PAT_REG.test( filPatStr ) && statSync( join( rooDirStr, filPatStr ) ).isFile() ); // What: File List Array. Why: Each file is read the same way. How: This keeps every non-empty tracked path that isn't skipped and is a regular file.

// #endregion Module State



// #region Helpers

type CtfResTyp = { bloOpeBoo : boolean, comTexStr : string }; // What: Comment-Text-Function Result Type. Why: comTexFun hands back the line's comment text and the block state together. How: This names the block flag and the text.

// #region comTexFun

/**
 * comTexFun = Comment Text Function
 *
 * @summary
 * Finds the comment text on one line of a file, given whether a block
 * comment was already open when the line began. Inside an open block, the
 * text runs to its closing marker or the line's end. Otherwise the earliest
 * opening marker the file's kind uses starts it: a line comment in a script
 * (two slashes at the line's start or after a space, so a URL's slashes never
 * count), a block comment in a script or stylesheet, an HTML comment, or a
 * hash at the start of a plain-text config line. A block opened and not
 * closed on the line stays open for the next one.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param linStr    - Line String: The line to read.
 * @param bloOpeBoo - Block Open Boolean: Whether a block comment was open
 *                    when the line began.
 * @param filPatStr - File Path String: The line's file, whose kind decides
 *                    its markers.
 *
 * @returns The line's comment text, empty when it has none, and whether a
 *          block comment is still open after it.
 *
 * @example
 * ```ts
 * comTexFun('a(); // What: Call.', false, 'x.ts')
 * // => { bloOpeBoo : false, comTexStr : ' What: Call.' }
 * ```
 *
*/

function comTexFun ( linStr : string, bloOpeBoo : boolean, filPatStr : string ) : CtfResTyp {


	if ( bloOpeBoo ) { // What: Open Block Branch. Why: A line inside a block comment is comment text until the block closes. How: This reads up to the first closing marker, or the whole line.


		const cloIndNum = [ linStr.indexOf( '*/' ), linStr.indexOf( '-->' ) ].filter( ( marIndNum ) => marIndNum >= 0 ).sort( ( indOneNum, indTwoNum ) => indOneNum - indTwoNum )[ 0 ]; // What: Close Index Number. Why: The block ends at whichever closing marker comes first. How: This finds the earliest one, or undefined when the line has none.



		return cloIndNum === undefined ? { bloOpeBoo : true, comTexStr : linStr } : { bloOpeBoo : false, comTexStr : linStr.slice( 0, cloIndNum ) }; // What: Block Text Return. Why: The caller needs the text and whether the block runs on. How: This returns the whole line with the block still open, or the text before its close with the block shut.


	}



	const filNamStr = filPatStr.split( '/' ).pop() ?? ''; // What: File Name String. Why: Plain-text config files are known by name rather than extension. How: This takes the path's last part.


	if ( PLA_NAM_SET.has( filNamStr ) ) return { bloOpeBoo : false, comTexStr : linStr.trimStart().startsWith( '#' ) ? linStr : '' }; // What: Plain Config Return. Why: A plain-text config file comments only with a hash at the line's start. How: This returns the whole line when it starts with one, and no text otherwise.



	const codFilBoo = COD_EXT_SET.has( extname( filPatStr ) );                           // What: Code File Boolean. Why: Only script files use line comments. How: This is true for a script extension.
	const slaIndNum = codFilBoo ? linStr.search( /(^|\s)\/\// ) : -1;                     // What: Slash Index Number. Why: A line comment starts at two slashes at the line's start or after a space. How: This finds them in a script, or holds -1 elsewhere.
	const marIndArr = [ slaIndNum, linStr.indexOf( '/*' ), linStr.indexOf( '<!--' ) ];  // What: Marker Index Array. Why: The earliest opening marker starts the comment. How: This holds each kind's position, or -1 when the line lacks it.
	const opeIndNum = Math.min( ...marIndArr.filter( ( marIndNum ) => marIndNum >= 0 ) ); // What: Open Index Number. Why: Whichever marker comes first decides the comment's kind. How: This takes the smallest position found, or Infinity when there's none.


	if ( opeIndNum === Infinity ) return { bloOpeBoo : false, comTexStr : '' }; // What: No Comment Return. Why: A line with no opening marker has no comment text. How: This returns empty text with no block open.



	const resTexStr = linStr.slice( opeIndNum ); // What: Rest Text String. Why: The comment runs from its marker onward. How: This takes the line from the marker to its end.


	if ( opeIndNum === slaIndNum ) return { bloOpeBoo : false, comTexStr : resTexStr }; // What: Line Comment Return. Why: A line comment runs to the line's end and never stays open. How: This returns the rest of the line.



	const bloCloBoo = resTexStr.includes( '*/' ) || resTexStr.includes( '-->' ); // What: Block Closed Boolean. Why: A block opened on this line may also close on it. How: This is true when a closing marker follows the opening one.



	return { bloOpeBoo : !bloCloBoo, comTexStr : resTexStr }; // What: Block Comment Return. Why: The caller needs the text and whether the block runs on. How: This returns the rest of the line, with the block open unless it closed here.


}

// #endregion comTexFun

// #endregion Helpers



// #region Module Init

let finCouNum = 0; // What: Find Count Number. Why: The list ends with how many words it found. How: This counts each one as it's printed.



for ( const filPatStr of filLisArr ) { // What: File Loop. Why: Every tracked file's comments are read. How: This walks the file list in git's order.


	let bloOpeBoo = false; // What: Block Open Boolean. Why: A block comment can span lines. How: This carries whether one is open from line to line.

	const linLisArr = readFileSync( join( rooDirStr, filPatStr ), 'utf8' ).split( '\n' ); // What: Line List Array. Why: Each word is reported by its line. How: This reads the file and splits it into lines.


	for ( const [ linIndNum, linStr ] of linLisArr.entries() ) { // What: Line Loop. Why: Each line's comment is searched on its own. How: This walks the lines with their index.


		const comResObj = comTexFun( linStr, bloOpeBoo, filPatStr ); // What: Comment Result Object. Why: The line's comment text and the block state come back together. How: This reads them from comTexFun.


		bloOpeBoo = comResObj.bloOpeBoo; // What: Block State Assignment. Why: The next line needs to know whether a block is still open. How: This keeps the state comTexFun returned.



		for ( const worMatObj of comResObj.comTexStr.matchAll( ABS_WOR_REG ) ) { // What: Word Loop. Why: Every absolute word gets its own line in the list. How: This walks each match in the comment text.


			const matIndNum = worMatObj.index ?? 0;                                                                                                          // What: Match Index Number. Why: The context is cut around the word. How: This reads where the match starts.
			const conTexStr = comResObj.comTexStr.slice( Math.max( 0, matIndNum - CON_WID_NUM ), matIndNum + worMatObj[ 0 ].length + CON_WID_NUM ).trim(); // What: Context Text String. Why: A reader judges the word by the words around it. How: This cuts the comment around the match, up to the context width on each side.


			console.log( `${ filPatStr }:${ linIndNum + 1 }: ${ worMatObj[ 0 ] } | ${ conTexStr }` ); // What: Word Print Call. Why: Each word has to be found and judged. How: This prints its path, line, the word, and its context.

			finCouNum++; // What: Count Increment. Why: The total covers every word printed. How: This adds one.


		}


	}


}



console.log( `${ finCouNum } absolute word(s) in comments` ); // What: Count Print Call. Why: The reader sees how many words the dedicated pass has to check. How: This prints the total.

// #endregion Module Init


