// AI Chat page

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';

export function renderAiChat(): string {
    return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar" style="padding: 0; padding-top: 52px;">
      <div class="chat-layout">
        <div class="chat-sidebar">
          <div class="chat-sidebar-header">
            <span class="chat-sidebar-title">会話履歴</span>
            <button class="chat-sidebar-new" id="btn-new-chat" title="新しい会話">
              ${icons.plus}
            </button>
          </div>
          <div class="chat-sidebar-empty">会話がありません</div>
        </div>
        <div class="chat-main">
          <div class="chat-main-header">新しい会話</div>
          <div class="chat-messages" id="chat-messages">
            <div class="chat-empty-icon">${icons.chat}</div>
            <div class="chat-empty-title">AI コーチと会話</div>
            <p class="chat-empty-desc">トレーニングについて質問したり、データ分析を依頼したり、プラン生成をリクエストできます。</p>
          </div>
          <div class="chat-input-area">
            <button class="chat-input-plus" id="chat-attach">
              ${icons.plus}
            </button>
            <input class="chat-input" type="text" id="chat-input" placeholder="メッセージを入力..." />
            <button class="chat-send-btn" id="chat-send">
              ${icons.send}
            </button>
          </div>
        </div>
      </div>
    </main>
  `;
}

import { generateAiResponse, getConversationHistory, resetConversation } from '../services/aiService';

export function initAiChat() {
    const inputEl = document.getElementById('chat-input') as HTMLInputElement;
    const sendBtn = document.getElementById('chat-send') as HTMLButtonElement;
    const messagesEl = document.getElementById('chat-messages');
    const newChatBtn = document.getElementById('btn-new-chat');

    // Restore UI from history if taking a look back
    const history = getConversationHistory();
    if (history.length > 0 && messagesEl) {
        messagesEl.innerHTML = '';
        messagesEl.style.justifyContent = 'flex-start';
        messagesEl.style.padding = '20px';
        messagesEl.style.overflowY = 'auto';
        
        history.forEach(msg => {
            const isUser = msg.role === 'user';
            const textHTML = msg.parts[0].text.replace(/\n/g, '<br/>');
            messagesEl.innerHTML += `
              <div class="message" style="justify-content: ${isUser ? 'flex-end' : 'flex-start'};">
                ${!isUser ? `<div class="message-avatar ai">AI</div>` : ''}
                <div class="message-content ${isUser ? 'user' : 'ai'}">${textHTML}</div>
                ${isUser ? `<div class="message-avatar user">BE</div>` : ''}
              </div>
            `;
        });
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    newChatBtn?.addEventListener('click', () => {
        resetConversation();
        if (messagesEl) {
            messagesEl.innerHTML = `
            <div class="chat-empty-icon">${icons.chat}</div>
            <div class="chat-empty-title">AI コーチと会話</div>
            <p class="chat-empty-desc">トレーニングについて質問したり、データ分析を依頼したり、プラン生成をリクエストできます。</p>
            `;
            messagesEl.style.justifyContent = 'center';
        }
    });

    async function sendMessage() {
        if (!inputEl || !messagesEl || !sendBtn) return;
        const text = inputEl.value.trim();
        if (!text) return;

        // Ensure configured
        if (!localStorage.getItem('gemini_api_key')) {
            alert('設定画面からGemini APIキーを登録してください。');
            return;
        }

        // Clear empty state on first message
        if (messagesEl.querySelector('.chat-empty-icon')) {
            messagesEl.innerHTML = '';
            messagesEl.style.justifyContent = 'flex-start';
            messagesEl.style.padding = '20px';
            messagesEl.style.overflowY = 'auto';
        }

        // User message
        messagesEl.innerHTML += `
      <div class="message" style="justify-content: flex-end;">
        <div class="message-content user">${text.replace(/\n/g, '<br/>')}</div>
        <div class="message-avatar user">BE</div>
      </div>
    `;

        inputEl.value = '';
        inputEl.disabled = true;
        sendBtn.disabled = true;
        
        // Show loading indicator
        const loadingId = 'loading-' + Date.now();
        messagesEl.innerHTML += `
        <div class="message" id="${loadingId}">
          <div class="message-avatar ai">AI</div>
          <div class="message-content ai" style="display: flex; align-items: center; gap: 8px;">
            <svg class="animate-spin" style="animation: spin 1s linear infinite; width: 16px; height: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
            <div>分析中... (Intervalsの生データを読み込んでいます)</div>
          </div>
        </div>
      `;
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            const aiResponseText = await generateAiResponse(text);
            
            // Remove loading
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Simple markdown parse for bold and line breaks
            let formattedHtml = aiResponseText
                .replace(/</g, "&lt;").replace(/>/g, "&gt;") // sanitize basic html
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>');

            // Detect if this is a training plan
            const planRegex = /### 第\s*\d+\s*週/g;
            let addToCalendarBtn = '';
            if (aiResponseText.match(planRegex)) {
                const planId = 'chat_' + Date.now().toString();
                const planTitle = `AIチャット提案プラン`;
                const planDate = new Date().toLocaleDateString('ja-JP');
                const saved = JSON.parse(localStorage.getItem('saved_plans') || '[]');
                saved.unshift({ id: planId, title: planTitle, content: aiResponseText, date: planDate });
                localStorage.setItem('saved_plans', JSON.stringify(saved.slice(0, 10)));
                
                addToCalendarBtn = `
                <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--color-border-light);">
                    <button class="btn btn-outline btn-sm" onclick="chatApplyPlanToCalendar('${planId}')" style="background:var(--color-bg); cursor:pointer;">
                        📅 カレンダーに適用する
                    </button>
                    <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 8px;">
                        適用前に「プラン」画面から手動で編集することも可能です。<br>
                        ※適用するとカレンダー画面に移動します。
                    </div>
                </div>
                `;
            }

            messagesEl.innerHTML += `
            <div class="message">
                <div class="message-avatar ai">AI</div>
                <div class="message-content ai" style="line-height: 1.6;">
                    ${formattedHtml}
                    ${addToCalendarBtn}
                </div>
            </div>
            `;
        } catch (error: any) {
            // Remove loading
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            messagesEl.innerHTML += `
            <div class="message">
                <div class="message-avatar ai">AI</div>
                <div class="message-content ai" style="color: var(--color-danger); background: var(--color-danger-bg);">
                    エラーが発生しました: ${error.message}
                </div>
            </div>
            `;
        } finally {
            inputEl.disabled = false;
            sendBtn.disabled = false;
            inputEl.focus();
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
    }

    sendBtn?.addEventListener('click', sendMessage);
    inputEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Handle applying plan from chat
    (window as any).chatApplyPlanToCalendar = (planId: string) => {
        const savedPlans = JSON.parse(localStorage.getItem('saved_plans') || '[]');
        const plan = savedPlans.find((p: any) => p.id === planId);
        if (!plan) return;

        const startStr = prompt('いつからこのプランを開始しますか？\\n(YYYY-MM-DD形式で入力。例: 2026-04-01)', new Date().toISOString().split('T')[0]);
        if (!startStr) return;

        const startDate = new Date(startStr);
        if (isNaN(startDate.getTime())) {
            alert('無効な日付形式です');
            return;
        }

        const lines = plan.content.split('\n');
        const scheduled = JSON.parse(localStorage.getItem('scheduled_workouts') || '[]');
        let currentWeek = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.match(/^### 第\s*(\d+)\s*週/)) {
                const match = line.match(/^### 第\s*(\d+)\s*週/);
                currentWeek = parseInt(match![1], 10) - 1;
            } else if (line.match(/^- \*\*(月|火|水|木|金|土|日)\*\*:/)) {
                const match = line.match(/^- \*\*(月|火|水|木|金|土|日)\*\*:\s*(.+)/);
                if (match && currentWeek >= 0) {
                    const dayStr = match[1];
                    const content = match[2];
                    const daysOffset: Record<string, number> = { '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6 };
                    const offsetInfo = daysOffset[dayStr];

                    if (offsetInfo !== undefined && !content.includes('レスト')) {
                        const targetDate = new Date(startDate);
                        const startDayOffset = (startDate.getDay() + 6) % 7;
                        const daysToAdd = (currentWeek * 7) + (offsetInfo - startDayOffset);
                        targetDate.setDate(targetDate.getDate() + daysToAdd);

                        const targetDateStr = targetDate.toISOString().split('T')[0];
                        const parts = content.split(' — ');
                        const title = parts[0].trim();
                        const desc = parts.length > 1 ? parts[1].trim() : '';

                        scheduled.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            date: targetDateStr,
                            title: title,
                            description: desc,
                            planId: planId
                        });
                    }
                }
            }
        }

        localStorage.setItem('scheduled_workouts', JSON.stringify(scheduled));
        alert('カレンダーにトレーニング予定を適用しました！\\nカレンダー画面に移動します。');
        window.location.hash = '#/calendar';
    };
}
