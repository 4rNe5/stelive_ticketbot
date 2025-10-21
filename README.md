# melon-ticket-actions

[![Build Status](https://github.com/mooyoul/melon-ticket-actions/workflows/workflow/badge.svg)](https://github.com/mooyoul/melon-ticket-actions/actions)
[![Semantic Release enabled](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![MIT license](http://img.shields.io/badge/license-MIT-blue.svg)](http://mooyoul.mit-license.org/)

GitHub action that checks ticket availability in Melon Ticket (Korean online ticket store) website and notifies via Discord webhook.

~~암표상들 다 망해라~~ 그리핀 내한공연 보게 해주세요 🙏

-----

![discord notification](assets/slack.png)

### ⭐️ 존버는 승리한다 ⭐️

![won](assets/won.jpg)

## Usage

Please see [example workflow](https://github.com/mooyoul/melon-ticket-actions/blob/1c5a56b9cdd594051d856c16b020f0c5835f6955/.github/workflows/example.yml), or [Workflow Log](https://github.com/mooyoul/melon-ticket-actions/actions?query=workflow%3Aexample) 

## Sample Github Actions Configuration

```yaml
name: example
on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Check Tickets
        uses: mooyoul/melon-ticket-actions@v1.1.0
        with:
          product-id: 204755
          schedule-id: 100001
          seat-id: 1_0
          discord-webhook-url: ${{ secrets.DISCORD_WEBHOOK_URL }}
          message: '@here 티켓 나왔어요!'
```

### Discord Mention 사용법

- `@here` - 현재 온라인인 사람들에게 알림
- `@everyone` - 모든 서버 멤버에게 알림
- `<@USER_ID>` - 특정 유저 멘션 (예: `<@123456789012345678>`)
- `<@&ROLE_ID>` - 특정 역할 멘션 (예: `<@&987654321098765432>`)

**USER_ID 또는 ROLE_ID 찾는 방법:**
1. Discord 설정 → 고급 → 개발자 모드 활성화
2. 유저/역할 우클릭 → ID 복사

**예시:**
```yaml
message: '@here 티켓 나왔어요!'
message: '@everyone 달려달려~'
message: '<@123456789012345678> 티켓 확인!'
```

## License

[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)
