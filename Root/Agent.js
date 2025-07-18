﻿var AgentAPI =
{
	"IO":
	{
		"SetHost": function (host, secure = true)
		{
			if (!host)
			{
				AgentAPI.Account.SetSessionString("AgentAPI.Host", null);
				AgentAPI.Account.SetSessionString("AgentAPI.Protocol", null);
			}
			else
			{
				AgentAPI.Account.SetSessionString("AgentAPI.Host", host);
				AgentAPI.Account.SetSessionString("AgentAPI.Protocol", secure ? "https" : "http");
			}
		},
		"GetBaseURL": function ()
		{
			const protocol = AgentAPI.Account.GetSessionString("AgentAPI.Protocol") || (window.location.protocol.includes("https") ? "https" : "http");
			const host = AgentAPI.Account.GetSessionString("AgentAPI.Host") || window.location.host;
			return `${protocol}://${host}`;
		},
		"GetHost": function ()
		{
			return AgentAPI.Account.GetSessionString("AgentAPI.Host") || window.location.host;
		},
		"Request": async function (Resource, RequestPayload, Internal, Language)
		{
			var Request = new Promise((SetResult, SetException) =>
			{
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function ()
				{
					if (xhttp.readyState == 4)
					{
						var Response = xhttp.responseText;

						if (xhttp.status === 200)
						{
							Response = JSON.parse(Response);
							SetResult(Response);
						}
						else
						{
							var Alternatives = [];
							var i = 1;
							var Alternative = xhttp.getResponseHeader("X-AlternativeName" + (i++).toString());

							while (Alternative)
							{
								Alternatives.push(Alternative);
								Alternative = xhttp.getResponseHeader("X-AlternativeName" + (i++).toString());
							}

							var Error =
							{
								"message": Response,
								"statusCode": xhttp.status,
								"statusMessage": xhttp.statusText,
								"alternatives": Alternatives
							};

							SetException(Error);
						}

						if (!Internal)
							AgentAPI.IO.AfterResponse(Response);

						delete xhttp;
					}
				};

				if (!Internal)
					this.BeforeRequest(RequestPayload);

				Resource = this.GetBaseURL() + Resource;

				if (RequestPayload)
				{
					xhttp.open("POST", Resource, true);

					if (!(RequestPayload instanceof FormData))
						xhttp.setRequestHeader("Content-Type", "application/json");
				}
				else
					xhttp.open("GET", Resource, true);

				xhttp.setRequestHeader("Accept", "application/json");

				if (Language)
					xhttp.setRequestHeader("Accept-Language", Language);

				var Token = AgentAPI.Account.GetSessionString("AgentAPI.Token");
				if (Token)
					xhttp.setRequestHeader("Authorization", "Bearer " + Token);

				if (RequestPayload instanceof FormData)
					xhttp.send(RequestPayload);
				else
					xhttp.send(JSON.stringify(RequestPayload));
			});

			return await Request;
		},
		"BeforeRequest": function (Payload)
		{
			var Control = document.getElementById("AgentRequestPayload");
			if (Control)
			{
				if (Payload)
				{
					if (Payload instanceof FormData)
					{
						const Form = {};
						for (let P of Payload.entries())
						{
							if (P[1] instanceof File)
								Form[P[0]] = 'File...';
							else if (P[1] instanceof Blob)
								Form[P[0]] = 'Blob...';
							else
								Form[P[0]] = P[1];
						}

						Payload = Form;
					}

					Control.innerText = JSON.stringify(Payload, null, 2);
				}
				else
					Control.innerText = "";
			}
		},
		"AfterResponse": function (Payload)
		{
			var Control = document.getElementById("AgentResponsePayload");
			if (Control)
			{
				if (Payload instanceof Error)
					Control.innerText = Payload.message;
				else
					Control.innerText = JSON.stringify(Payload, null, 2);
			}
		},
		"Log": function (Message)
		{
			console.log((new Date()).toString() + ": " + Message);
		},
		"LoadFileAsArrayBuffer": async function (FileInput)
		{
			var Request = new Promise((SetResult, SetException) =>
			{
				var Reader = new FileReader();

				Reader.onload = async function (e)
				{
					SetResult(
						{
							"result": e.target.result,
							"name": FileInput.name,
							"type": FileInput.type
						});
				};

				Reader.onerror = async function (e)
				{
					SetException(e);
				};

				Reader.readAsArrayBuffer(FileInput);
			});

			return await Request;
		},
		"LoadFileAsDataUrl": async function (FileInput)
		{
			var Request = new Promise((SetResult, SetException) =>
			{
				var Reader = new FileReader();

				Reader.onload = async function (e)
				{
					SetResult(
						{
							"result": e.target.result,
							"name": FileInput.name,
							"type": FileInput.type
						});
				};

				Reader.onerror = async function (e)
				{
					SetException(e);
				};

				Reader.readAsDataURL(FileInput);
			});

			return await Request;
		},
		"Delete": async function (Resource, Internal, Language)
		{
			var Request = new Promise((SetResult, SetException) =>
			{
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function ()
				{
					if (xhttp.readyState == 4)
					{
						var Response = xhttp.responseText;

						if (xhttp.status >= 200 && xhttp.status < 300)
						{
							if (Response !== "")
								Response = JSON.parse(Response);

							SetResult(Response);
						}
						else
						{
							var Error =
							{
								"message": Response,
								"statusCode": xhttp.status,
								"statusMessage": xhttp.statusText,
								"alternatives": Alternatives
							};

							SetException(Error);
						}

						if (!Internal)
							AgentAPI.IO.AfterResponse(Response);

						delete xhttp;
					}
				};

				if (!Internal)
					this.BeforeRequest(null);

				xhttp.open("DELETE", Resource, true);
				xhttp.setRequestHeader("Accept", "application/json");

				if (Language)
					xhttp.setRequestHeader("Accept-Language", Language);

				var Token = AgentAPI.Account.GetSessionString("AgentAPI.Token");
				if (Token)
					xhttp.setRequestHeader("Authorization", "Bearer " + Token);

				xhttp.send();
			});

			return await Request;
		}
	},
	"Account":
	{
		"Utf8": new TextEncoder("utf-8"),
		"Base64Alphabet":
			[
				"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
				"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
				"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
				"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
				"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
			],
		"Base64Encode": function (Data)
		{
			var Result = "";
			var i;
			var c = Data.length;

			for (i = 2; i < c; i += 3)
			{
				Result += this.Base64Alphabet[Data[i - 2] >> 2];
				Result += this.Base64Alphabet[((Data[i - 2] & 0x03) << 4) | (Data[i - 1] >> 4)];
				Result += this.Base64Alphabet[((Data[i - 1] & 0x0F) << 2) | (Data[i] >> 6)];
				Result += this.Base64Alphabet[Data[i] & 0x3F];
			}

			if (i === c)
			{
				Result += this.Base64Alphabet[Data[i - 2] >> 2];
				Result += this.Base64Alphabet[((Data[i - 2] & 0x03) << 4) | (Data[i - 1] >> 4)];
				Result += this.Base64Alphabet[(Data[i - 1] & 0x0F) << 2];
				Result += "=";
			}
			else if (i === c + 1)
			{
				Result += this.Base64Alphabet[Data[i - 2] >> 2];
				Result += this.Base64Alphabet[(Data[i - 2] & 0x03) << 4];
				Result += "==";
			}

			return Result;
		},
		"XmlEncode": function (s)
		{
			return s
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&apos;")
				.replace(/\n/g, "&#10;")
				.replace(/\r/g, "&#13;")
				.replace(/\t/g, "&#9;")
				.replace(/\v/g, "&#11;")
				.replace(/\f/g, "&#12;");
		},
		"Sign": async function (Key, Data)
		{
			var Algorithm = await window.crypto.subtle.importKey("raw", this.Utf8.encode(Key), { name: "HMAC", "hash": "SHA-256" }, false, ["sign"]);
			var H = await window.crypto.subtle.sign("HMAC", Algorithm, this.Utf8.encode(Data));

			return this.Base64Encode(new Uint8Array(H));
		},
		"GetSessionString": function (Name)
		{
			return sessionStorage.getItem(Name);
		},
		"SetSessionString": function (Name, Value)
		{
			return sessionStorage.setItem(Name, Value);
		},
		"RemoveSessionValue": function (Name)
		{
			return sessionStorage.removeItem(Name);
		},
		"GetSessionInt": function (Name)
		{
			var s = this.GetSessionString(Name);
			if (s)
				return parseInt(s);
			else
				return null;
		},
		"SetSessionInt": function (Name, Value)
		{
			this.SetSessionString(Name, Value.toString());
		},
		"RefreshToken": async function ()
		{
			AgentAPI.Account.RemoveSessionValue("AgentAPI.RefreshTimer");
			AgentAPI.Account.RemoveSessionValue("AgentAPI.RefreshTimerElapses");
			AgentAPI.Account.RemoveSessionValue("AgentAPI.RefreshTimerExpires");

			var Seconds = AgentAPI.Account.GetSessionInt("AgentAPI.Seconds");
			if (Seconds)
				AgentAPI.Account.Refresh(Seconds, true)
		},
		"RestartActiveSession": function ()
		{
			var Token = this.GetSessionString("AgentAPI.Token");
			var Seconds = this.GetSessionInt("AgentAPI.Seconds");

			if (Token && Seconds)
			{
				AgentAPI.IO.Log("Checking last session.");
				this.CheckSessionToken(Token, Seconds, false);
			}
			else
				AgentAPI.IO.Log("No session found.");
		},
		"CheckSessionToken": function (Token, Seconds, NewToken)
		{
			var OldTimer = this.GetSessionInt("AgentAPI.RefreshTimer");
			var Elapses = this.GetSessionInt("AgentAPI.RefreshTimerElapses");
			var Expires = this.GetSessionInt("AgentAPI.RefreshTimerExpires");
			var Now = Math.round(Date.now() / 1000);

			if (!OldTimer || !Expires || !Elapses)
			{
				if (NewToken)
					AgentAPI.IO.Log("Saving new session token.");
				else
					AgentAPI.IO.Log("Resaving session token.");

				this.SaveSessionToken(Token, Seconds, Math.round(Seconds / 2));
			}
			else if (Expires > Now)
			{
				if (Elapses <= Now)
				{
					if (NewToken)
					{
						AgentAPI.IO.Log("New token replaces old token.");
						this.SaveSessionToken(Token, Seconds, Math.round(Seconds / 2));
					}
					else
					{
						AgentAPI.IO.Log("Token elapsed, but not expired. Refreshing token.");
						this.RefreshToken();
					}
				}
				else
				{
					if (NewToken)
						AgentAPI.IO.Log("Saving new session token, using previous session timer.");
					else
						AgentAPI.IO.Log("Restarting previous session token.");

					this.SaveSessionToken(Token, Seconds, Elapses - Now);
				}
			}
			else if (NewToken)
			{
				AgentAPI.IO.Log("Saving new session token.");
				this.SaveSessionToken(Token, Seconds, Math.round(Seconds / 2));
			}
			else
				AgentAPI.IO.Log("Obsolete session token.");
		},
		"SaveSessionToken": function (Token, Seconds, Next)
		{
			var OldTimer = this.GetSessionInt("AgentAPI.RefreshTimer");
			if (OldTimer)
			{
				AgentAPI.IO.Log("Stopping previous session timer.");
				window.clearTimeout(OldTimer);
			}

			var Now = Math.round(Date.now() / 1000);

			this.SetSessionString("AgentAPI.Token", Token);
			this.SetSessionInt("AgentAPI.Seconds", Seconds);
			this.SetSessionInt("AgentAPI.RefreshTimer", window.setTimeout(this.RefreshToken, 1000 * Next));
			this.SetSessionInt("AgentAPI.RefreshTimerElapses", Now + Next);
			this.SetSessionInt("AgentAPI.RefreshTimerExpires", Now + Seconds);

			AgentAPI.IO.Log("Resetting session timer to " + Next + "s, with token life cycle of " + Seconds + "s");
		},
		"DomainInfo": async function (Language)
		{
			var Response = await AgentAPI.IO.Request("/Agent/Account/DomainInfo", null, false, Language);
			return Response;
		},
		"Create": async function (UserName, EMail, PhoneNr, Password, ApiKey, Secret, Seconds, Language)
		{
			var Nonce = this.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s;

			if (Seconds === undefined)
			{
				Seconds = Secret;
				Secret = ApiKey;
				Password = PhoneNr;
				PhoneNr = "";
			}

			if (PhoneNr)
				s = UserName + ":" + AgentAPI.IO.GetHost() + ":" + EMail + ":" + PhoneNr + ":" + Password + ":" + ApiKey + ":" + Nonce;
			else
				s = UserName + ":" + AgentAPI.IO.GetHost() + ":" + EMail + ":" + Password + ":" + ApiKey + ":" + Nonce;

			if (!Language)
				Language = "en";

			var Response = await AgentAPI.IO.Request("/Agent/Account/Create",
				{
					"userName": UserName,
					"eMail": EMail,
					"phoneNr": PhoneNr,
					"password": Password,
					"apiKey": ApiKey,
					"nonce": Nonce,
					"signature": await this.Sign(Secret, s),
					"seconds": Seconds,
					"language": Language
				});

			this.SetSessionString("AgentAPI.UserName", UserName);
			this.SaveSessionToken(Response.jwt, Seconds, Math.round(Seconds / 2));

			return Response;
		},
		"GetSessionToken": async function ()
		{
			var Response = await AgentAPI.IO.Request("/Agent/Account/GetSessionToken",
				{
				});

			this.CheckSessionToken(Response.AccountCreated.jwt, Response.seconds, true);
		},
		"VerifyEMail": async function (EMail, Code)
		{
			var Result = await AgentAPI.IO.Request("/Agent/Account/VerifyEMail",
				{
					"eMail": EMail,
					"code": Code
				});

			return Result;
		},
		"VerifyPhoneNr": async function (PhoneNr, Code)
		{
			var Result = await AgentAPI.IO.Request("/Agent/Account/VerifyPhoneNr",
				{
					"phoneNr": PhoneNr,
					"code": Code
				});

			return Result;
		},
		"ResendVerificationCodes": async function (EMail, PhoneNr, Language)
		{
			if (!Language)
				Language = "en";

			var Result = await AgentAPI.IO.Request("/Agent/Account/ResendVerificationCodes",
				{
					"eMail": EMail,
					"phoneNr": PhoneNr,
					"language": Language
				});

			return Result;
		},
		"Login": async function (UserName, Password, Seconds)
		{
			var Nonce = this.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s = UserName + ":" + AgentAPI.IO.GetHost() + ":" + Nonce;
			var Response = await AgentAPI.IO.Request("/Agent/Account/Login",
				{
					"userName": UserName,
					"nonce": Nonce,
					"signature": await this.Sign(Password, s),
					"seconds": Seconds
				});

			this.SetSessionString("AgentAPI.UserName", UserName);
			this.SaveSessionToken(Response.jwt, Seconds, Math.round(Seconds / 2));

			return Response;
		},
		"QuickLogin": async function (Seconds)
		{
			var Response = await AgentAPI.IO.Request("/Agent/Account/QuickLogin",
				{
					"seconds": Seconds
				});

			this.SetSessionString("AgentAPI.UserName", Response.userName);
			this.SaveSessionToken(Response.jwt, Seconds, Math.round(Seconds / 2));

			return Response;
		},
		"Refresh": async function (Seconds, Internal)
		{
			AgentAPI.IO.Log("Requesting a refresh of Agent API session token.");

			var Response = await AgentAPI.IO.Request("/Agent/Account/Refresh",
				{
					"seconds": Seconds
				}, Internal);

			this.SaveSessionToken(Response.jwt, Seconds, Math.round(Seconds / 2));

			return Response;
		},
		"Logout": async function ()
		{
			var OldTimer = this.GetSessionInt("AgentAPI.RefreshTimer");
			if (OldTimer)
			{
				AgentAPI.IO.Log("Stopping session timer.");
				window.clearTimeout(OldTimer);
			}

			this.RemoveSessionValue("AgentAPI.UserName");
			this.RemoveSessionValue("AgentAPI.Seconds");
			this.RemoveSessionValue("AgentAPI.RefreshTimer");
			this.RemoveSessionValue("AgentAPI.RefreshTimerElapses");
			this.RemoveSessionValue("AgentAPI.RefreshTimerExpires");

			var Response = await AgentAPI.IO.Request("/Agent/Account/Logout",
				{
				});

			this.RemoveSessionValue("AgentAPI.Token");

			return Response;
		},
		"Recover": async function (UserName, PersonalNr, Country, EMail, PhoneNr)
		{
			var Result = await AgentAPI.IO.Request("/Agent/Account/Recover",
				{
					"userName": UserName,
					"personalNr": PersonalNr,
					"country": Country,
					"eMail": EMail,
					"phoneNr": PhoneNr
				});

			return Result;
		},
		"AuthenticateJwt": async function (Token)
		{
			var Result = await AgentAPI.IO.Request("/Agent/Account/AuthenticateJwt",
				{
					"token": Token
				});

			return Result;
		},
		"Info": async function ()
		{
			var Result = await AgentAPI.IO.Request("/Agent/Account/Info",
				{
				});

			return Result;
		},
		"Transfer": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword, Pin)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var Nonce = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + Nonce + ":" + Pin;

			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"nonce": Nonce,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"pin": Pin
			};

			var Response = await AgentAPI.IO.Request("/Agent/Account/Transfer", Request);

			return Response;
		}
	},
	"Xmpp":
	{
		"SendTextMessage": async function (To, Message, Subject, Language, Id)
		{
			var Request =
			{
				"to": To,
				"message": Message
			};

			if (Subject)
				Request.subject = Subject;

			if (Language)
				Request.language = Language;

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendTextMessage", Request);

			if (!Response.sent)
				throw new Error("Message not sent.");

			return Response.id;
		},
		"SendFormattedMessage": async function (To, Message, Subject, Language, Id)
		{
			var Request =
			{
				"to": To,
				"message": Message
			};

			if (Subject)
				Request.subject = Subject;

			if (Language)
				Request.language = Language;

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendFormattedMessage", Request);

			if (!Response.sent)
				throw new Error("Message not sent.");

			return Response.id;
		},
		"SendXmlMessage": async function (To, Xml, Subject, Language, Id)
		{
			var Request =
			{
				"to": To,
				"xml": Xml
			};

			if (Subject)
				Request.subject = Subject;

			if (Language)
				Request.language = Language;

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendXmlMessage", Request);

			if (!Response.sent)
				throw new Error("Message not sent.");

			return Response.id;
		},
		"SendPresenceSubscription": async function (To, CustomXml, Language, Id)
		{
			var Request =
			{
				"to": To
			};

			if (CustomXml)
				Request.customXml = CustomXml;

			if (Language)
				Request.language = Language;

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendPresenceSubscription", Request);

			if (!Response.sent)
				throw new Error("Subscription not sent.");

			return Response.id;
		},
		"SendPresenceUnsubscription": async function (To, Id)
		{
			var Request =
			{
				"to": To
			};

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendPresenceUnsubscription", Request);

			if (!Response.sent)
				throw new Error("Unsubscription not sent.");

			return Response.id;
		},
		"SendSubscriptionAccepted": async function (To, Id)
		{
			var Request =
			{
				"to": To
			};

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendSubscriptionAccepted", Request);

			if (!Response.sent)
				throw new Error("Subscription acceptance not sent.");

			return Response.id;
		},
		"SendSubscriptionDeclined": async function (To, Id)
		{
			var Request =
			{
				"to": To
			};

			if (Id)
				Request.id = Id;

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SendSubscriptionDeclined", Request);

			if (!Response.sent)
				throw new Error("Subscription declination not sent.");

			return Response.id;
		},
		"GetRoster": async function (Offset, MaxCount)
		{
			var Request =
			{
				"offset": Offset,
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/GetRoster", Request);

			return Response;
		},
		"GetRosterItem": async function (BareJid)
		{
			var Request =
			{
				"bareJid": BareJid
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/GetRosterItem", Request);

			return Response;
		},
		"SetRosterItem": async function (BareJid, Name, Groups)
		{
			var Request =
			{
				"bareJid": BareJid,
				"name": Name,
				"Groups": Groups,
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/SetRosterItem", Request);

			return Response;
		},
		"RemoveRosterItem": async function (BareJid)
		{
			var Request =
			{
				"bareJid": BareJid
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/RemoveRosterItem", Request);

			return Response;
		},
		"PresenceProbe": async function (BareJid)
		{
			var Request =
			{
				"to": BareJid
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/PresenceProbe", Request);

			return Response;
		},
		"InformationQuery": async function (BareJid, Type, QueryXml)
		{
			var Request =
			{
				"to": BareJid,
				"type": Type,
				"xml": QueryXml
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/InformationQuery", Request);

			return Response;
		},
		"PopMessages": async function (MaxCount)
		{
			var Request =
			{
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/PopMessages", Request);

			return Response;
		},
		"ClearMessages": async function ()
		{
			var Request =
			{
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/ClearMessages", Request);

			return Response;
		},
		"RegisterEventHandler": async function (LocalName, Namespace, Type, Function)
		{
			var Request =
			{
				"localName": LocalName,
				"namespace": Namespace,
				"type": Type,
				"function": Function,
				"tabId": TabID
			};

			var Response = await AgentAPI.IO.Request("/Agent/Xmpp/RegisterEventHandler", Request);

			return Response;
		},
		"UnregisterEventHandler": async function (LocalName, Namespace, Type)
		{
			return this.RegisterEventHandler(LocalName, Namespace, Type, "");
		}
	},
	"Storage":
	{
		"SavePrivateXml": async function (Xml)
		{
			var Request =
			{
				"xml": Xml
			};

			var Response = await AgentAPI.IO.Request("/Agent/Storage/SavePrivateXml", Request);

			return Response;
		},
		"LoadPrivateXml": async function (LocalName, Namespace)
		{
			var Request =
			{
				"localName": LocalName,
				"namespace": Namespace
			};

			var Response = await AgentAPI.IO.Request("/Agent/Storage/LoadPrivateXml", Request);

			return Response;
		},
		"Upload": async function (ContentFile, ContentId, Visibility)
		{
			var Request = new FormData();

			Request.append("Content", ContentFile, ContentFile.name);
			Request.append("ContentId", ContentId);
			Request.append("Visibility", Visibility);

			var Response = await AgentAPI.IO.Request("/Agent/Storage/Content", Request);

			return Response;
		},
		"Delete": async function (Url)
		{
			var Response = await AgentAPI.IO.Delete(Url);
			return Response;
		}
	},
	"Crypto":
	{
		"GetAlgorithms": async function ()
		{
			var Request = {};
			var Response = await AgentAPI.IO.Request("/Agent/Crypto/GetAlgorithms", Request);

			return Response;
		},
		"CreateKey": async function (LocalName, Namespace, Id, KeyPassword, AccountPassword)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var Nonce = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" +
				Namespace + ":" + Id;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + Nonce;
			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"localName": LocalName,
				"namespace": Namespace,
				"id": Id,
				"nonce": Nonce,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature
			};

			var Response = await AgentAPI.IO.Request("/Agent/Crypto/CreateKey", Request);

			return Response;
		},
		"GetPublicKey": async function (KeyId)
		{
			var Request = {};

			if (KeyId)
				Request.keyId = KeyId;

			var Response = await AgentAPI.IO.Request("/Agent/Crypto/GetPublicKey", Request);

			return Response;
		}
	},
	"Legal":
	{
		"ValidatePNr": async function (CountryCode, PNr)
		{
			var Request =
			{
				"countryCode": CountryCode,
				"pnr": PNr
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/ValidatePNr", Request);

			return Response;
		},
		"GetApplicationAttributes": async function ()
		{
			var Request =
			{
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetApplicationAttributes", Request);

			return Response;
		},
		"ApplyId": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword, Properties)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var Nonce = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + Nonce;
			var PropertiesVector = [];

			for (var PropertyName in Properties)
			{
				var PropertyValue = Properties[PropertyName];
				s2 += ":" + PropertyName + ":" + PropertyValue;
				PropertiesVector.push(
					{
						"name": PropertyName,
						"value": PropertyValue
					});
			}

			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"nonce": Nonce,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"Properties": PropertiesVector
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/ApplyId", Request);

			return Response;
		},
		"AddIdAttachment": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword, LegalId, Attachment, FileName, ContentType)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var Nonce = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + Nonce + ":" + Attachment + ":" + FileName + ":" + ContentType + ":" + LegalId;

			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"legalId": LegalId,
				"nonce": Nonce,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"attachmentBase64": Attachment,
				"attachmentFileName": FileName,
				"attachmentContentType": ContentType
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/AddIdAttachment", Request);

			return Response;
		},
		"CreateContract": async function (TemplateId, Visibility, Parts, Parameters)
		{
			var ParametersVector = [];

			for (var ParameterName in Parameters)
			{
				ParametersVector.push(
					{
						"name": ParameterName,
						"value": Parameters[ParameterName]
					});
			}

			var Request =
			{
				"templateId": TemplateId,
				"visibility": Visibility,
				"Parts": Parts,
				"Parameters": ParametersVector
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/CreateContract", Request);

			return Response;
		},
		"ProposeTemplate": async function (TemplateBase64)
		{
			var Request =
			{
				"templateBase64": TemplateBase64
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/ProposeTemplate", Request);

			return Response;
		},
		"GetIdentity": async function (LegalId)
		{
			var Request =
			{
				"legalId": LegalId
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetIdentity", Request);

			return Response;
		},
		"GetContract": async function (ContractId, Format)
		{
			var Request =
			{
				"contractId": ContractId
			};

			if (Format)
				Request["format"] = Format;

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetContract", Request);

			return Response;
		},
		"SignContract": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword, ContractId, LegalId, Role)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var Nonce = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + Nonce + ":" + LegalId + ":" + ContractId + ":" + Role;
			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"nonce": Nonce,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"contractId": ContractId,
				"legalId": LegalId,
				"role": Role
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/SignContract", Request);

			return Response;
		},
		"SignData": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword, LegalId, DataBase64)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + DataBase64 + ":" + LegalId;
			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"legalId": LegalId,
				"dataBase64": DataBase64
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/SignData", Request);

			return Response;
		},
		"GetIdentities": async function (Offset, MaxCount)
		{
			var Request =
			{
				"offset": Offset,
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetIdentities", Request);

			return Response;
		},
		"GetCreatedContracts": async function (Offset, MaxCount)
		{
			var Request =
			{
				"offset": Offset,
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetCreatedContracts", Request);

			return Response;
		},
		"GetSignedContracts": async function (Offset, MaxCount)
		{
			var Request =
			{
				"offset": Offset,
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetSignedContracts", Request);

			return Response;
		},
		"ReadyForApproval": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword, LegalId)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var Nonce = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + Nonce + ":" + LegalId;

			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"legalId": LegalId,
				"nonce": Nonce,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/ReadyForApproval", Request);

			return Response;
		},
		"SendProposal": async function (ContractId, Role, To, Message)
		{
			var Xml = "<contractProposal xmlns='urn:nf:iot:leg:sc:1.0" +
				"' contractId='" + AgentAPI.Account.XmlEncode(ContractId) +
				"' role='" + AgentAPI.Account.XmlEncode(Role) +
				"' message='" + AgentAPI.Account.XmlEncode(Message) +
				"'/>";

			await AgentAPI.Xmpp.SendXmlMessage(To, Xml);
		},
		"GetServiceProvidersForIdReview": async function (LegalId)
		{
			var Request =
			{
				"legalId": LegalId
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/GetServiceProvidersForIdReview", Request);

			return Response;
		},
		"SelectReviewService": async function (ServiceId, ServiceProvider)
		{
			var Request =
			{
				"serviceId": ServiceId,
				"serviceProvider": ServiceProvider
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/SelectReviewService", Request);

			return Response;
		},
		"AuthorizeAccessToId": async function (LegalId, RemoteId, Authorized)
		{
			var Request =
			{
				"legalId": LegalId,
				"remoteId": RemoteId,
				"authorized": Authorized
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/AuthorizeAccessToId", Request);

			return Response;
		},
		"AuthorizeAccessToContract": async function (ContractId, RemoteId, Authorized)
		{
			var Request =
			{
				"contractId": ContractId,
				"remoteId": RemoteId,
				"authorized": Authorized
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/AuthorizeAccessToContract", Request);

			return Response;
		},
		"PetitionId": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword,
			LegalId, RemoteId, PetitionId, Purpose)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + PetitionId + ":" + Purpose +
				":" + LegalId + ":" + RemoteId;
			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"legalId": LegalId,
				"remoteId": RemoteId,
				"petitionId": PetitionId,
				"purpose": Purpose
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/PetitionId", Request);

			return Response;
		},
		"PetitionSignature": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword,
			LegalId, RemoteId, PetitionId, Purpose, ContentBase64)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + PetitionId + ":" + Purpose +
				":" + LegalId + ":" + RemoteId + ":" + ContentBase64;
			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"legalId": LegalId,
				"remoteId": RemoteId,
				"petitionId": PetitionId,
				"purpose": Purpose,
				"contentBase64": ContentBase64
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/PetitionSignature", Request);

			return Response;
		},
		"PetitionPeerReview": async function (LocalName, Namespace, KeyId, KeyPassword, AccountPassword,
			LegalId, RemoteId, PetitionId, Purpose)
		{
			var UserName = AgentAPI.Account.GetSessionString("AgentAPI.UserName");
			var s1 = UserName + ":" + AgentAPI.IO.GetHost() + ":" + LocalName + ":" + Namespace + ":" + KeyId;
			var KeySignature = await AgentAPI.Account.Sign(KeyPassword, s1);
			var s2 = s1 + ":" + KeySignature + ":" + PetitionId + ":" + Purpose +
				":" + LegalId + ":" + RemoteId;
			var RequestSignature = await AgentAPI.Account.Sign(AccountPassword, s2);

			var Request =
			{
				"keyId": KeyId,
				"keySignature": KeySignature,
				"requestSignature": RequestSignature,
				"legalId": LegalId,
				"remoteId": RemoteId,
				"petitionId": PetitionId,
				"purpose": Purpose
			};

			var Response = await AgentAPI.IO.Request("/Agent/Legal/PetitionPeerReview", Request);

			return Response;
		}
	},
	"Wallet":
	{
		"GetBalance": async function ()
		{
			var Request =
			{
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/GetBalance", Request);

			return Response;
		},
		"ProcessEDalerUri": async function (Uri)
		{
			var Request =
			{
				"uri": Uri
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/ProcessEDalerUri", Request);

			return Response;
		},
		"GetServiceProvidersForBuyingEDaler": async function ()
		{
			var Request =
			{
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/GetServiceProvidersForBuyingEDaler", Request);

			return Response;
		},
		"GetServiceProvidersForSellingEDaler": async function ()
		{
			var Request =
			{
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/GetServiceProvidersForSellingEDaler", Request);

			return Response;
		},
		"GetPaymentOptionsForBuyingEDaler": async function (ServiceId, ServiceProvider,
			SuccessUrl, FailureUrl, CancelUrl, TransactionId, TabId, FunctionName)
		{
			var Request =
			{
				"serviceId": ServiceId,
				"serviceProvider": ServiceProvider,
				"successUrl": SuccessUrl,
				"failureUrl": FailureUrl,
				"cancelUrl": CancelUrl,
				"transactionId": TransactionId,
				"tabId": TabId,
				"functionName": FunctionName
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/GetPaymentOptionsForBuyingEDaler", Request);

			return Response;
		},
		"GetPaymentOptionsForSellingEDaler": async function (ServiceId, ServiceProvider,
			SuccessUrl, FailureUrl, CancelUrl, TransactionId, TabId, FunctionName)
		{
			var Request =
			{
				"serviceId": ServiceId,
				"serviceProvider": ServiceProvider,
				"successUrl": SuccessUrl,
				"failureUrl": FailureUrl,
				"cancelUrl": CancelUrl,
				"transactionId": TransactionId,
				"tabId": TabId,
				"functionName": FunctionName
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/GetPaymentOptionsForSellingEDaler", Request);

			return Response;
		},
		"InitiateBuyEDaler": async function (ServiceId, ServiceProvider, Amount, Currency,
			SuccessUrl, FailureUrl, CancelUrl, TransactionId, TabId, FunctionName)
		{
			var Request =
			{
				"serviceId": ServiceId,
				"serviceProvider": ServiceProvider,
				"amount": Amount,
				"currency": Currency,
				"successUrl": SuccessUrl,
				"failureUrl": FailureUrl,
				"cancelUrl": CancelUrl,
				"transactionId": TransactionId,
				"tabId": TabId,
				"functionName": FunctionName
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/InitiateBuyEDaler", Request);

			return Response;
		},
		"InitiateSellEDaler": async function (ServiceId, ServiceProvider, Amount, Currency,
			SuccessUrl, FailureUrl, CancelUrl, TransactionId, TabId, FunctionName)
		{
			var Request =
			{
				"serviceId": ServiceId,
				"serviceProvider": ServiceProvider,
				"amount": Amount,
				"currency": Currency,
				"successUrl": SuccessUrl,
				"failureUrl": FailureUrl,
				"cancelUrl": CancelUrl,
				"transactionId": TransactionId,
				"tabId": TabId,
				"functionName": FunctionName
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/InitiateSellEDaler", Request);

			return Response;
		},
		"GetTransactionInformation": async function (TransactionId, TabId, FunctionName)
		{
			var Request =
			{
				"transactionId": TransactionId,
				"tabId": TabId,
				"functionName": FunctionName
			};

			var Response = await AgentAPI.IO.Request("/Agent/Wallet/GetTransactionInformation", Request);

			return Response;
		}
	},
	"Tokens":
	{
		"GetTokens": async function (Offset, MaxCount, References)
		{
			var Request =
			{
				"offset": Offset,
				"maxCount": MaxCount,
				"references": References
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/GetTokens", Request);

			return Response;
		},
		"GetContractTokens": async function (ContractId, Offset, MaxCount, References)
		{
			var Request =
			{
				"contractId": ContractId,
				"offset": Offset,
				"maxCount": MaxCount,
				"references": References
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/GetContractTokens", Request);

			return Response;
		},
		"GetCreationAttributes": async function ()
		{
			var Request =
			{
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/GetCreationAttributes", Request);

			return Response;
		},
		"GetToken": async function (TokenId)
		{
			var Request =
			{
				"tokenId": TokenId
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/GetToken", Request);

			return Response;
		},
		"GetDescription": async function (TokenId, ReportFormat)
		{
			var Request =
			{
				"tokenId": TokenId,
				"reportFormat": ReportFormat
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/GetDescription", Request);

			return Response;
		},
		"AddTextNote": async function (TokenId, Note, Personal)
		{
			var Request =
			{
				"tokenId": TokenId,
				"note": Note,
				"personal": Personal
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/AddTextNote", Request);

			return Response;
		},
		"AddXmlNote": async function (TokenId, Note, Personal)
		{
			var Request =
			{
				"tokenId": TokenId,
				"note": Note,
				"personal": Personal
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/AddXmlNote", Request);

			return Response;
		},
		"GetTokenEvents": async function (TokenId, Offset, MaxCount)
		{
			var Request =
			{
				"tokenId": TokenId,
				"offset": Offset,
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Tokens/GetTokenEvents", Request);

			return Response;
		}
	},
	"StateMachines":
	{
		"GetCurrentState": async function (TokenId)
		{
			var Request =
			{
				"tokenId": TokenId
			};

			var Response = await AgentAPI.IO.Request("/Agent/StateMachines/GetCurrentState", Request);

			return Response;
		},
		"CreateReport": async function (TokenId, ReportType, ReportFormat)
		{
			var Request =
			{
				"tokenId": TokenId,
				"reportType": ReportType,
				"reportFormat": ReportFormat
			};

			var Response = await AgentAPI.IO.Request("/Agent/StateMachines/CreateReport", Request);

			return Response;
		}
	},
	"Intelligence":
	{
		"CheckEndpoint": async function (Endpoint)
		{
			var Request =
			{
				"endpoint": Endpoint
			};

			var Response = await AgentAPI.IO.Request("/Agent/Intelligence/CheckEndpoint", Request);

			return Response;
		},
		"Add": async function (Endpoint, Expires, Vector, Protocol, Classification, Code, Message, Tags, AgentProperties)
		{
			var Request =
			{
				"Information":
				{
					"endpoint": Endpoint,
					"expires": Expires,
					"vector": Vector,
					"protocol": Protocol,
					"classification": Classification,
					"code": Code,
					"message": Message,
					"Tag": Tags,
					"AgentProperty": AgentProperties
				}
			};

			var Response = await AgentAPI.IO.Request("/Agent/Intelligence/Add", Request);

			return Response;
		},
		"Update": async function (ObjectId, Endpoint, Expires, Vector, Protocol, Classification, Code, Message, Tags, AgentProperties)
		{
			var Request =
			{
				"objectId": ObjectId,
				"Information":
				{
					"endpoint": Endpoint,
					"expires": Expires,
					"vector": Vector,
					"protocol": Protocol,
					"classification": Classification,
					"code": Code,
					"message": Message,
					"Tag": Tags,
					"AgentProperty": AgentProperties
				}
			};

			var Response = await AgentAPI.IO.Request("/Agent/Intelligence/Update", Request);

			return Response;
		},
		"Delete": async function (ObjectId)
		{
			var Request =
			{
				"objectId": ObjectId
			};

			var Response = await AgentAPI.IO.Request("/Agent/Intelligence/Delete", Request);

			return Response;
		},
		"Get": async function (Endpoint, Vector, Protocol, Classification, Code, From, To, Offset, MaxCount)
		{
			var Request =
			{
				"endpoint": Endpoint,
				"vector": Vector,
				"protocol": Protocol,
				"classification": Classification,
				"code": Code,
				"from": From,
				"to": To,
				"offset": Offset,
				"maxCount": MaxCount
			};

			var Response = await AgentAPI.IO.Request("/Agent/Intelligence/Get", Request);

			return Response;
		}
	}
};

AgentAPI.Account.RestartActiveSession();