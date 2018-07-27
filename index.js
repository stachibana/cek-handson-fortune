const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const bodyParser = require('body-parser');

// 応答の最後に追加するテンプレート
const TEMPLATE_INQUIRY = '星座を言うか、使い方、もしくは終了と呼びかけて下さい。';

const clovaSkillHandler = clova.Client
  .configureSkill()
  // スキルの起動リクエスト
  .onLaunchRequest(responseHelper => {
    responseHelper.setSimpleSpeech({
      lang: 'ja',
      type: 'PlainText',
      value: `「サンプル占い」が起動されました。${TEMPLATE_INQUIRY}`,
    });
  })
  // カスタムインテント or ビルトインインテント
  .onIntentRequest(responseHelper => {
    const intent = responseHelper.getIntentName();
    let speech;
    switch (intent) {
      // ユーザーのインプットが星座だと判別された場合。第2引数はreprompt(入力が行われなかった場合の聞き返し)をするか否か。省略可。
      case 'FortuneIntent':
        // 星座を取得
        const slots = responseHelper.getSlots()
        // Slotに登録されていない星座はnullになる
        if(slots.zodiac_signs == null) {
          speech = {
            lang: 'ja',
            type: 'PlainText',
            value: `星座に誤りがあります。他の星座でお試し下さい。`
          }
          responseHelper.setSimpleSpeech(speech)
          responseHelper.setSimpleSpeech(speech, true)
          // 下記でも可
          /*
          responseHelper.setSimpleSpeech(
            clova.SpeechBuilder.createSpeechText(`星座に誤りがあります。他の星座でお試し下さい。`)
          );
          */
          break
        }
        // 「中吉」だと「なかよし」発生されてしまう
        const fortune = ['大吉', 'ちゅうきち', '小吉', '吉', '凶']
        const zodiacSigns = ['牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座', '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座']
        // 日と星座を元に運勢を決定。日が変わると違う運勢に。
        const fortuneToday = fortune[(new Date().getDate() + zodiacSigns.indexOf(slots.zodiac_signs)) % fortune.length]

        speech = {
          lang: 'ja',
          type: 'PlainText',
          value: `${slots.zodiac_signs}の今日の運勢は${fortuneToday}です。${TEMPLATE_INQUIRY}`
        }
        responseHelper.setSimpleSpeech(speech)
        responseHelper.setSimpleSpeech(speech, true)

        break;
      // ビルトインインテント。ユーザーによるインプットが使い方のリクエストと判別された場合
      case 'Clova.GuideIntent':
        speech = {
          lang: 'ja',
          type: 'PlainText',
          value: TEMPLATE_INQUIRY
        }
        responseHelper.setSimpleSpeech(speech)
        responseHelper.setSimpleSpeech(speech, true)
        //});
        break;
      // ビルトインインテント。ユーザーによるインプットが肯定/否定/キャンセルのみであった場合
      case 'Clova.YesIntent':
      case 'Clova.NoIntent':
      case 'Clova.CancelIntent':
        speech = {
          lang: 'ja',
          type: 'PlainText',
          value: `意図しない入力です。${TEMPLATE_INQUIRY}`
        }
        responseHelper.setSimpleSpeech(speech)
        break;
    }
  })
  // スキルの終了リクエスト
  .onSessionEndedRequest(responseHelper => {
  })
  .handle();

const app = new express();
//TODO
// リクエストの検証を行う場合。環境変数APPLICATION_ID(値はClova Developer Center上で入力したExtension ID)が必須
const clovaMiddleware = clova.Middleware({
  applicationId: process.env.APPLICATION_ID
});
app.post('/clova', clovaMiddleware, clovaSkillHandler);

// リクエストの検証を行わない
//app.post('/clova', bodyParser.json(), clovaSkillHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
