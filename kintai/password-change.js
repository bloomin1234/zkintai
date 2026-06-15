/* ============================================================
   Z勤怠 パスワード変更機能
   ============================================================ */

/**
 * パスワード変更フォームの初期化
 */
function initPasswordChangeForm() {
  const btnPwrSave = document.getElementById('btn-pwr-save');
  const pwrNewInput = document.getElementById('pwr-new');
  
  if (!btnPwrSave || !pwrNewInput) return;

  // 保存ボタンのクリックイベント
  btnPwrSave.addEventListener('click', async () => {
    const newPassword = pwrNewInput.value.trim();

    // バリデーション
    if (!newPassword) {
      toast('新しいパスワードを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      toast('パスワードは8文字以上である必要があります');
      return;
    }

    // パスワード変更処理
    await changePassword(newPassword);
  });

  // Enterキーでも送信できるように
  pwrNewInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      btnPwrSave.click();
    }
  });
}

/**
 * パスワード変更をサーバーに送信
 * @param {string} newPassword - 新しいパスワード
 */
async function changePassword(newPassword) {
  const btnPwrSave = document.getElementById('btn-pwr-save');
  const originalText = btnPwrSave.textContent;
  
  try {
    btnPwrSave.disabled = true;
    btnPwrSave.textContent = '処理中...';

    // URLのクエリパラメータからトークンを取得
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (!resetToken) {
      toast('無効なリセットリンクです');
      return;
    }

    // クラウドAPIへのリクエスト
    const response = await fetch(`${S.cloud.url}/rest/v1/rpc/change_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${S.cloud.anonKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        reset_token: resetToken,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.message || 'パスワード変更に失敗しました';
      toast(errorMsg);
      btnPwrSave.disabled = false;
      btnPwrSave.textContent = originalText;
      return;
    }

    // 成功時の処理
    toast('パスワードを変更しました。ログイン画面にリダイレクトします...');
    
    // ローカルストレージをクリア
    await dbClear('settings');
    
    // 2秒後にログイン画面にリダイレクト
    setTimeout(() => {
      window.location.href = './';
    }, 2000);

  } catch (error) {
    console.error('パスワード変更エラー:', error);
    toast('エラーが発生しました: ' + (error.message || '不明なエラー'));
    btnPwrSave.disabled = false;
    btnPwrSave.textContent = originalText;
  }
}

/**
 * パスワード変更モーダルを表示
 */
function showPasswordChangeModal() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('token')) {
    openModal('m-pwreset');
    // 入力フィールドをクリア
    const pwrNewInput = document.getElementById('pwr-new');
    if (pwrNewInput) {
      pwrNewInput.value = '';
      pwrNewInput.focus();
    }
  }
}

/**
 * ページロード時にパスワード変更が必要かチェック
 */
function checkPasswordReset() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('token')) {
    // 起動完了後にモーダルを表示
    if (window.ZK_READY) {
      window.ZK_READY.then(() => {
        setTimeout(showPasswordChangeModal, 500);
      });
    } else {
      // フォールバック
      setTimeout(showPasswordChangeModal, 1000);
    }
  }
}

// ページロード時にチェック
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPasswordChangeForm();
    checkPasswordReset();
  });
} else {
  initPasswordChangeForm();
  checkPasswordReset();
}
