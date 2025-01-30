import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('deepcode.run-r1', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepcode',
			'DeepCode Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message:any) => {
			if(message.command === 'chat'){
				const userPrompt = message.text
				let responseText = ''

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1',
						messages: [{role: 'user', content: userPrompt}],
						stream: true
					})

					for await (const part of streamResponse){
						responseText += part.message.content
						panel.webview.postMessage({ command: 'chatResponse', text: responseText})
					}
				} catch (err){
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` })
				}
			}
		})
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return /*html*/ `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DeepCode Extension</title>
    <style>
        :root {
            --vscode-bg: var(--vscode-editor-background, #1e1e1e);
            --vscode-fg: var(--vscode-editor-foreground, #d4d4d4);
            --vscode-input-bg: var(--vscode-input-background, #3c3c3c);
            --vscode-button-bg: var(--vscode-button-background, #0e639c);
            --vscode-button-hover-bg: var(--vscode-button-hoverBackground, #1177bb);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-bg);
            color: var(--vscode-fg);
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 400;
        }

        .chat-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        #prompt {
            width: 100%;
            min-height: 100px;
            padding: 12px;
            background-color: var(--vscode-input-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: var(--vscode-fg);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            box-sizing: border-box;
            line-height: 1.5;
        }

        #prompt:focus {
            outline: 1px solid var(--vscode-button-bg);
            border-color: transparent;
        }

        .button-container {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        #askBtn {
            background-color: var(--vscode-button-bg);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        #askBtn:hover {
            background-color: var(--vscode-button-hover-bg);
        }

        #askBtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #response {
            background-color: var(--vscode-input-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            padding: 16px;
            min-height: 100px;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.6;
        }

        .loading {
            display: none;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 13px;
        }

        .loading.active {
            display: flex;
        }

        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--vscode-button-bg);
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>DeepCode Chat</h2>
        </div>
        
        <div class="chat-container">
            <textarea 
                id="prompt" 
                placeholder="Ask a question or describe your task..."
                spellcheck="false"
            ></textarea>
            
            <div class="button-container">
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Generating response...</span>
                </div>
                <button id="askBtn">Ask DeepCode</button>
            </div>

            <div id="response"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const askBtn = document.getElementById("askBtn");
        const promptInput = document.getElementById("prompt");
        const loadingEl = document.querySelector(".loading");

        function setLoading(isLoading) {
            askBtn.disabled = isLoading;
            loadingEl.classList.toggle("active", isLoading);
        }

        askBtn.addEventListener("click", function() {
            const text = promptInput.value.trim();
            if (!text) return;
            
            setLoading(true);
            document.getElementById('response').innerText = '';
            vscode.postMessage({ command: 'chat', text });
        });

        // Allow submission with Cmd/Ctrl + Enter
        promptInput.addEventListener("keydown", function(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                askBtn.click();
            }
        });

        window.addEventListener('message', event => {
            const { command, text } = event.data;
            if (command === 'chatResponse') {
                document.getElementById('response').innerText = text;
                setLoading(false);
            }
        });
    </script>
</body>
</html>
    `;
}

export function deactivate() { }
