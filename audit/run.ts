


// #region Imports

import { fileURLToPath } from 'node:url';           // What: File URL To Path. Why: check.ts sits beside this script, wherever it's run from. How: This turns check.ts's file URL into a path.
import { spawnSync     } from 'node:child_process'; // What: Spawn Sync. Why: Each tool runs to completion, one after another, printing straight to the terminal. How: This runs a command and waits for it, sharing this script's output.

// #endregion Imports



/**
 * run.ts = Mechanical Audit Runner
 *
 * @summary
 * Runs every mechanical audit from "## Full Project Audits" against one
 * project: ESLint, the TypeScript build check, and check.ts's scripted format
 * checks. ESLint and tsc -b run inside the project, and check.ts runs from
 * here with the project's path. Each tool prints its own findings under a
 * == <tool> header, and the script exits with 1 when any tool failed, or
 * when no project was given.
 *
 * Run it as node ~/projects/claude-rules/audit/run.ts <project-root>. Node
 * strips this file's own types, so Node 23.6 or newer runs it directly.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type TooRecTyp = { // What: Tool Record Type. Why: Every tool is run the same way. How: This names a tool's arguments, command, working folder, and header label.


	argArr : string[], // What: Argument Array. Why: Each tool takes its own arguments. How: This lists them in order.
	comStr : string,   // What: Command String. Why: Each tool starts from its own program. How: This is the program run.
	dirStr : string,   // What: Directory String. Why: ESLint and tsc -b read the project's own config from where they run. How: This is the folder the tool runs in.
	labStr : string    // What: Label String. Why: Each tool's output sits under its own header. How: This is the name printed after ==.


};

// #endregion Types



// #region Constants

const CHE_PAT_STR = fileURLToPath( new URL( './check.ts', import.meta.url ) ); // What: Check Path String. Why: check.ts sits beside this script. How: This resolves its path from this script's own location.

// #endregion Constants



// #region Module State

const rooDirStr = process.argv[ 2 ] ?? ''; // What: Root Directory String. Why: Every tool audits the project given on the command line. How: This reads the first argument, or holds an empty string when none was given.


if ( !rooDirStr ) { // What: Usage Guard. Why: The tools have nothing to audit without a project. How: This prints the usage line and exits with 1.


	console.error( 'usage: node run.ts <project-root>' ); // What: Usage Message Call. Why: The person running it should learn what it expects. How: This prints the usage line to standard error.

	process.exit( 1 ); // What: Usage Exit Call. Why: A missing argument means nothing ran. How: This exits with 1.


}



const tooRecArr : TooRecTyp[] = [ // What: Tool Record Array. Why: The tools run in a fixed order, each the same way. How: Each row names one tool's command, arguments, folder, and header.


	{ argArr : [ 'eslint', '.' ],          comStr : 'npx',            dirStr : rooDirStr, labStr : 'eslint'   }, // What: ESLint Tool. Why: Lint runs first, per the pre-commit rule check. How: This runs npx eslint . inside the project.
	{ argArr : [ 'tsc', '-b' ],            comStr : 'npx',            dirStr : rooDirStr, labStr : 'tsc -b'   }, // What: Type Check Tool. Why: The type check runs before the format checks. How: This runs npx tsc -b inside the project.
	{ argArr : [ CHE_PAT_STR, rooDirStr ], comStr : process.execPath, dirStr : '.',       labStr : 'check.ts' }  // What: Format Check Tool. Why: The scripted format checks run last. How: This runs check.ts with this same Node, from the current folder, on the project's path as given.


];



let exiCodNum = 0; // What: Exit Code Number. Why: Every tool runs even after one fails, and the result reports whether any did. How: This turns to 1 once any tool fails.

// #endregion Module State



// #region Module Init

for ( const tooRecObj of tooRecArr ) { // What: Tool Loop. Why: Each tool runs in turn under its own header. How: This prints the header, runs the tool, and notes a failure.


	console.log( `== ${ tooRecObj.labStr }` ); // What: Header Print Call. Why: Each tool's findings sit under its own name. How: This prints == and the tool's label.


	const runResObj = spawnSync( tooRecObj.comStr, tooRecObj.argArr, { cwd : tooRecObj.dirStr, stdio : 'inherit' } ); // What: Run Result Object. Why: The tool's exit status decides the overall result. How: This runs the tool in its folder, sharing this script's output, and waits for it.


	if ( runResObj.error ) console.error( runResObj.error.message ); // What: Start Failure Message. Why: A tool that can't start, such as one given a folder that doesn't exist, prints nothing of its own. How: This prints why it couldn't start.



	if ( runResObj.status !== 0 ) exiCodNum = 1; // What: Failure Check. Why: Any tool that fails or finds something fails the audit. How: This sets the exit code to 1 for a non-zero or missing status.


}



process.exit( exiCodNum ); // What: Result Exit Call. Why: A caller reads the overall result from the exit code. How: This exits with 1 when any tool failed and 0 otherwise.

// #endregion Module Init


