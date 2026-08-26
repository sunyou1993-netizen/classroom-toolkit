//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

// 크로미움 계열 브라우저를 "앱 모드"로 띄웁니다.
// 주소창·탭·즐겨찾기가 없는 창이라 교실 화면에서 프로그램처럼 보입니다.
func openBrowser(url string) *exec.Cmd {
	candidates := []string{}
	for _, base := range []string{
		os.Getenv("ProgramFiles(x86)"),
		os.Getenv("ProgramFiles"),
		os.Getenv("LocalAppData"),
	} {
		if base == "" {
			continue
		}
		candidates = append(candidates,
			filepath.Join(base, `Microsoft\Edge\Application\msedge.exe`),
			filepath.Join(base, `Google\Chrome\Application\chrome.exe`),
		)
	}

	// 전용 프로필을 쓰면 이 창이 독립된 프로세스가 되어,
	// 창을 닫는 순간을 우리가 알 수 있습니다(= 서버도 같이 종료).
	profile := filepath.Join(os.TempDir(), "suup-doumi-profile")

	for _, exe := range candidates {
		if _, err := os.Stat(exe); err != nil {
			continue
		}
		cmd := exec.Command(exe,
			"--app="+url,
			"--user-data-dir="+profile,
			"--start-fullscreen",
			"--start-maximized", // 전체화면이 안 먹는 환경에서의 대비
			"--no-first-run",
			"--no-default-browser-check",
			"--disable-features=Translate,PrivacySandboxSettings4",
			"--use-fake-ui-for-media-stream", // 소음측정기 마이크 권한 팝업 없이 허용
		)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		if err := cmd.Start(); err == nil {
			return cmd
		}
	}

	// 엣지도 크롬도 없으면 기본 브라우저로.
	_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	return nil
}

// 백그라운드 프로세스로 떼어냅니다(부모가 끝나도 계속 돌도록).
func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x00000008} // DETACHED_PROCESS
}
