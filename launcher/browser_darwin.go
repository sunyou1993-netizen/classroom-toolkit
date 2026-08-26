//go:build darwin

package main

import (
	"os"
	"os/exec"
	"syscall"
)

// 맥에서도 크로미움 계열 브라우저를 "앱 모드"로 띄웁니다.
func openBrowser(url string) *exec.Cmd {
	candidates := []string{
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		os.Getenv("HOME") + "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	}
	profile := os.TempDir() + "/suup-doumi-profile"

	for _, exe := range candidates {
		if _, err := os.Stat(exe); err != nil {
			continue
		}
		cmd := exec.Command(exe,
			"--app="+url,
			"--user-data-dir="+profile,
			"--start-fullscreen",
			"--start-maximized",
			"--no-first-run",
			"--no-default-browser-check",
			"--use-fake-ui-for-media-stream", // 소음측정기 마이크 권한 팝업 없이 허용
		)
		if err := cmd.Start(); err == nil {
			return cmd
		}
	}

	// 크롬도 엣지도 없으면 기본 브라우저로.
	_ = exec.Command("open", url).Start()
	return nil
}

// 백그라운드 프로세스로 떼어냅니다(부모가 끝나도 계속 돌도록).
func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
}
