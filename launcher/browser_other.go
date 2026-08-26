//go:build !windows

package main

import "os/exec"

// 리눅스·맥에서는 서버 동작만 확인할 용도로 씁니다(테스트 전용).
func openBrowser(url string) *exec.Cmd { return nil }
