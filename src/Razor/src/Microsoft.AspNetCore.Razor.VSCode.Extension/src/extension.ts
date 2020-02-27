/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';
import * as razorExtensionPackage from 'microsoft.aspnetcore.razor.vscode';
import * as path from 'path';
import * as vscode from 'vscode';
import { ensureWorkspaceIsConfigured, registerRazorDevModeHelpers } from './RazorDevModeHelpers';

let activationResolver: (value?: any) => void;
export const extensionActivated = new Promise(resolve => {
    activationResolver = resolve;
});

// class SemanticTokensLegend {
//     public readonly tokenTypes: string[];
//     public readonly tokenModifiers: string[];

//     constructor(tokenTypes: string[], tokenModifiers: string[]) {
//         this.tokenTypes = tokenTypes;
//         this.tokenModifiers = tokenModifiers;
//     }
// }

// interface DocumentSemanticTokensProvider {
//     /**
//      * A file can contain many tokens, perhaps even hundreds of thousands of tokens. Therefore, to improve
//      * the memory consumption around describing semantic tokens, we have decided to avoid allocating an object
//      * for each token and we represent tokens from a file as an array of integers. Furthermore, the position
//      * of each token is expressed relative to the token before it because most tokens remain stable relative to
//      * each other when edits are made in a file.
//      *
//      * ---
//      * In short, each token takes 5 integers to represent, so a specific token `i` in the file consists of the following array indices:
//      *  - at index `5*i`   - `deltaLine`: token line number, relative to the previous token
//      *  - at index `5*i+1` - `deltaStart`: token start character, relative to the previous token (relative to 0 or the previous token's start if they are on the same line)
//      *  - at index `5*i+2` - `length`: the length of the token. A token cannot be multiline.
//      *  - at index `5*i+3` - `tokenType`: will be looked up in `SemanticTokensLegend.tokenTypes`
//      *  - at index `5*i+4` - `tokenModifiers`: each set bit will be looked up in `SemanticTokensLegend.tokenModifiers`
//      *
//      * ---
//      * ### How to encode tokens
//      *
//      * Here is an example for encoding a file with 3 tokens in a uint32 array:
//      * ```
//      *    { line: 2, startChar:  5, length: 3, tokenType: "properties", tokenModifiers: ["private", "static"] },
//      *    { line: 2, startChar: 10, length: 4, tokenType: "types",      tokenModifiers: [] },
//      *    { line: 5, startChar:  2, length: 7, tokenType: "classes",    tokenModifiers: [] }
//      * ```
//      *
//      * 1. First of all, a legend must be devised. This legend must be provided up-front and capture all possible token types.
//      * For this example, we will choose the following legend which must be passed in when registering the provider:
//      * ```
//      *    tokenTypes: ['properties', 'types', 'classes'],
//      *    tokenModifiers: ['private', 'static']
//      * ```
//      *
//      * 2. The first transformation step is to encode `tokenType` and `tokenModifiers` as integers using the legend. Token types are looked
//      * up by index, so a `tokenType` value of `1` means `tokenTypes[1]`. Multiple token modifiers can be set by using bit flags,
//      * so a `tokenModifier` value of `3` is first viewed as binary `0b00000011`, which means `[tokenModifiers[0], tokenModifiers[1]]` because
//      * bits 0 and 1 are set. Using this legend, the tokens now are:
//      * ```
//      *    { line: 2, startChar:  5, length: 3, tokenType: 0, tokenModifiers: 3 },
//      *    { line: 2, startChar: 10, length: 4, tokenType: 1, tokenModifiers: 0 },
//      *    { line: 5, startChar:  2, length: 7, tokenType: 2, tokenModifiers: 0 }
//      * ```
//      *
//      * 3. The next steps is to encode each token relative to the previous token in the file. In this case, the second token
//      * is on the same line as the first token, so the `startChar` of the second token is made relative to the `startChar`
//      * of the first token, so it will be `10 - 5`. The third token is on a different line than the second token, so the
//      * `startChar` of the third token will not be altered:
//      * ```
//      *    { deltaLine: 2, deltaStartChar: 5, length: 3, tokenType: 0, tokenModifiers: 3 },
//      *    { deltaLine: 0, deltaStartChar: 5, length: 4, tokenType: 1, tokenModifiers: 0 },
//      *    { deltaLine: 3, deltaStartChar: 2, length: 7, tokenType: 2, tokenModifiers: 0 }
//      * ```
//      *
//      * 4. Finally, the last step is to inline each of the 5 fields for a token in a single array, which is a memory friendly representation:
//      * ```
//      *    // 1st token,  2nd token,  3rd token
//      *    [  2,5,3,0,3,  0,5,4,1,0,  3,2,7,2,0 ]
//      * ```
//      */
//     provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<SemanticTokens | SemanticTokensEdits>;

//     /**
//      * Instead of always returning all the tokens in a file, it is possible for a `DocumentSemanticTokensProvider` to implement
//      * this method (`updateSemanticTokens`) and then return incremental updates to the previously provided semantic tokens.
//      *
//      * ---
//      * ### How tokens change when the document changes
//      *
//      * Let's look at how tokens might change.
//      *
//      * Continuing with the above example, suppose a new line was inserted at the top of the file.
//      * That would make all the tokens move down by one line (notice how the line has changed for each one):
//      * ```
//      *    { line: 3, startChar:  5, length: 3, tokenType: "properties", tokenModifiers: ["private", "static"] },
//      *    { line: 3, startChar: 10, length: 4, tokenType: "types",      tokenModifiers: [] },
//      *    { line: 6, startChar:  2, length: 7, tokenType: "classes",    tokenModifiers: [] }
//      * ```
//      * The integer encoding of the tokens does not change substantially because of the delta-encoding of positions:
//      * ```
//      *    // 1st token,  2nd token,  3rd token
//      *    [  3,5,3,0,3,  0,5,4,1,0,  3,2,7,2,0 ]
//      * ```
//      * It is possible to express these new tokens in terms of an edit applied to the previous tokens:
//      * ```
//      *    [  2,5,3,0,3,  0,5,4,1,0,  3,2,7,2,0 ] // old tokens
//      *    [  3,5,3,0,3,  0,5,4,1,0,  3,2,7,2,0 ] // new tokens
//      *
//      *    edit: { start:  0, deleteCount: 1, data: [3] } // replace integer at offset 0 with 3
//      * ```
//      *
//      * Furthermore, let's assume that a new token has appeared on line 4:
//      * ```
//      *    { line: 3, startChar:  5, length: 3, tokenType: "properties", tokenModifiers: ["private", "static"] },
//      *    { line: 3, startChar: 10, length: 4, tokenType: "types",      tokenModifiers: [] },
//      *    { line: 4, startChar:  3, length: 5, tokenType: "properties", tokenModifiers: ["static"] },
//      *    { line: 6, startChar:  2, length: 7, tokenType: "classes",    tokenModifiers: [] }
//      * ```
//      * The integer encoding of the tokens is:
//      * ```
//      *    // 1st token,  2nd token,  3rd token,  4th token
//      *    [  3,5,3,0,3,  0,5,4,1,0,  1,3,5,0,2,  2,2,7,2,0, ]
//      * ```
//      * Again, it is possible to express these new tokens in terms of an edit applied to the previous tokens:
//      * ```
//      *    [  3,5,3,0,3,  0,5,4,1,0,  3,2,7,2,0 ]               // old tokens
//      *    [  3,5,3,0,3,  0,5,4,1,0,  1,3,5,0,2,  2,2,7,2,0, ]  // new tokens
//      *
//      *    edit: { start: 10, deleteCount: 1, data: [1,3,5,0,2,2] } // replace integer at offset 10 with [1,3,5,0,2,2]
//      * ```
//      *
//      * *NOTE*: When doing edits, it is possible that multiple edits occur until VS Code decides to invoke the semantic tokens provider.
//      * *NOTE*: If the provider cannot compute `SemanticTokensEdits`, it can "give up" and return all the tokens in the document again.
//      * *NOTE*: All edits in `SemanticTokensEdits` contain indices in the old integers array, so they all refer to the previous result state.
//      */
//     provideDocumentSemanticTokensEdits?(document: vscode.TextDocument, previousResultId: string, token: vscode.CancellationToken): vscode.ProviderResult<SemanticTokens | SemanticTokensEdits>;
// }

// tslint:disable-next-line: max-classes-per-file
// class SemanticTokens {
//     public readonly resultId?: string;

//     public readonly data: Uint32Array;

//     constructor(data: Uint32Array, resultId?: string) {
//         this.resultId = resultId;
//         this.data = data;
//     }
// }

// tslint:disable-next-line: max-classes-per-file
export class SemanticTokensEdit {
    public readonly start: number;
    public readonly deleteCount: number;
    public readonly data?: Uint32Array;
    constructor(start: number, deleteCount: number, data?: Uint32Array) {
        this.start = start;
        this.deleteCount = deleteCount;
        this.data = data;
    }
}

// tslint:disable-next-line: max-classes-per-file
export class SemanticTokensEdits {
    public readonly resultId?: string;
    public readonly edits: SemanticTokensEdit[];
    constructor(edits: SemanticTokensEdit[], resultId?: string) {
        this.resultId = resultId;
        this.edits = edits;
    }
}

// // tslint:disable-next-line: max-classes-per-file
// class RazorDocumentSemanticTokensProvider implements DocumentSemanticTokensProvider {
//     public provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken):
//     vscode.ProviderResult<SemanticTokens | SemanticTokensEdits> {
//         throw new Error('Method not implemented.');
//     }

// }

export async function activate(context: vscode.ExtensionContext) {
    // Because this extension is only used for local development and tests in CI,
    // we know the Razor Language Server is at a specific path within this repo
    const config = process.env.config ? process.env.config : 'Debug';

    const languageServerDir = path.join(
        __dirname, '..', '..', '..', '..', '..', 'artifacts', 'bin', 'rzls', config, 'netcoreapp5.0');

    if (!fs.existsSync(languageServerDir)) {
        vscode.window.showErrorMessage(`The Razor Language Server project has not yet been built - could not find ${languageServerDir}`);
        return;
    }

    const hostEventStream = {
        post: (event: any) => {
            // 1 corresponds to the telemetry event type from OmniSharp
            if (event.type === 1) {
                console.log(`Telemetry Event: ${event.eventName}.`);
                if (event.properties) {
                    const propertiesString = JSON.stringify(event.properties, null, 2);
                    console.log(propertiesString);
                }
            } else {
                console.log(`Unknown event: ${event.eventName}`);
            }
        },
    };

    vscode.commands.registerCommand('extension.razorActivated', () => extensionActivated);

    await registerRazorDevModeHelpers(context);
    const workspaceConfigured = ensureWorkspaceIsConfigured();

    if (workspaceConfigured) {
        await razorExtensionPackage.activate(
            vscode,
            context,
            languageServerDir,
            hostEventStream);
    } else {
        console.log('Razor workspace was not configured, extension activation skipped.');
        console.log('To configure your workspace run the following command (ctrl+shift+p) in the experimental instance "Razor: Configure workspace for Razor extension development"');
    }

    activationResolver();
}
