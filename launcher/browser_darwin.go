//go:build darwin

package main

import (
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"
)

const macProfile = "suup-doumi-profile"

// 맥에서도 크로미움 계열 브라우저를 "앱 모드"로 띄웁니다.
//
// 중요: 브라우저를 우리 자식 프로세스로 실행하면, macOS 는 마이크·카메라 권한을
// "수업도우미"가 요청한 것으로 봅니다. 그러면 프로그램을 새로 받을 때마다
// 권한 팝업이 다시 뜹니다(파일이 바뀌면 다른 앱으로 취급하기 때문).
// 그래서 open 명령으로 띄워 브라우저가 스스로 권한 주인이 되게 합니다.
// 크롬에 한 번 허용해 두면 그 뒤로는 팝업이 뜨지 않습니다.
func openBrowser(url string) *exec.Cmd {
	apps := []string{"Google Chrome", "Microsoft Edge"}
	profile := os.TempDir() + "/" + macProfile

	args := []string{
		"--app=" + url,
		"--user-data-dir=" + profile,
		"--start-fullscreen",
		"--start-maximized",
		"--no-first-run",
		"--no-default-browser-check",
		"--use-fake-ui-for-media-stream", // 브라우저 자체 권한 창은 띄우지 않습니다
	}

	for _, app := range apps {
		if _, err := os.Stat("/Applications/" + app + ".app"); err != nil {
			if _, err2 := os.Stat(os.Getenv("HOME") + "/Applications/" + app + ".app"); err2 != nil {
				continue
			}
		}
		cmd := exec.Command("open", append([]string{"-na", app, "--args"}, args...)...)
		if err := cmd.Run(); err == nil {
			return nil // 창이 닫히는 시점은 waitForClose 가 지켜봅니다
		}
	}

	// 크롬도 엣지도 없으면 기본 브라우저로.
	_ = exec.Command("open", url).Start()
	return nil
}

// open 으로 띄운 창은 자식 프로세스가 아니라서, 살아 있는지 직접 확인합니다.
// 창이 사라지면 서버도 함께 종료합니다.
func waitForClose() {
	seen := false
	for i := 0; i < 6*60*12; i++ { // 최대 12시간
		time.Sleep(10 * time.Second)
		out, _ := exec.Command("pgrep", "-f", macProfile).Output()
		alive := strings.TrimSpace(string(out)) != ""
		if alive {
			seen = true
		} else if seen {
			return // 창이 닫혔습니다
		}
	}
}

// 백그라운드 프로세스로 떼어냅니다(부모가 끝나도 계속 돌도록).
func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
}

// 종료 요청에 응답하지 않는 예전 버전(자기 자신의 프로세스)을 정리합니다.
// 자기 파일 이름 + --serve 로만 좁혀서 찾으므로 다른 프로그램은 건드리지 않습니다.
func killOldInstances() {
	_ = exec.Command("pkill", "-f", "suup-doumi --serve").Run()
}
