import resend

resend.api_key = "re_xxxxxxxxx"

params: resend.ApiKeys.CreateParams = {
  "name": "Production",
}

resend.ApiKeys.create(params)
