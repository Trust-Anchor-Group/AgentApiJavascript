AgentAPI["Things"] =
{
	"XmppHelper":
	{
		"ConcentratorNamespace": "urn:nf:iot:concentrator:1.0",
		"JidType":
		{
			"Domain": 0,
			"Bare": 1,
			"Full": 2
		},
		"ClassifyJid": function (JID)
		{
			var i = JID.indexOf("@");
			if (i < 0)
				return this.JidType.Domain;

			i = JID.indexOf("/", i);
			if (i < 0)
				return this.JidType.Bare;
			else
				return this.JidType.Full;
		},
		"GetFullJid": async function (JID)
		{
			if (this.ClassifyJid(JID) == this.JidType.Bare)
			{
				var Presence = await AgentAPI.Xmpp.PresenceProbe(JID);
				if (Presence.jid && this.ClassifyJid(Presence.jid) === this.JidType.Full)
					return Presence.jid;
			}

			return JID;
		},
		"AssertResponseOk": function (Response)
		{
			if (!Response.ok)
			{
				if (Response.ErrorElement)
				{
					if (Response.ErrorElement.text)
						throw new Error(Response.ErrorElement.text.value);

					for (const Name of Object.keys(Response.ErrorElement))
					{
						if (!Name.startsWith("__") && Name !== "type")
							throw new Error(Name);
					}
				}

				throw new Error("Request failed.");
			}
		},
		"TokenInformationQuery": async function (Name, Type, JID, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";

			if (DeviceToken)
				Query += " dt='" + DeviceToken + "'";

			if (ServiceToken)
				Query += " st='" + ServiceToken + "'";

			if (UserToken)
				Query += " ut='" + UserToken + "'";

			Query += "/>";

			JID = await this.GetFullJid(JID);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		}
	},
	"Concentrator":
	{
		"GetCapabilities": async function (JID, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.TokenInformationQuery(
				"getCapabilities", "get", JID, DeviceToken, ServiceToken, UserToken);

			var Strings = Response.Stanza.strings.value;
			var i, c = Strings.length;
			var Result = new Array(c);

			for (i = 0; i < c; i++)
				Result[i] = Strings[i].value;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetAllDataSources": async function (JID, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.TokenInformationQuery(
				"getAllDataSources", "get", JID, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.dataSources.dataSource;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetRootDataSources": async function (JID, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.TokenInformationQuery(
				"getRootDataSources", "get", JID, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.dataSources.dataSource;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		}
	},
	"Sensor":
	{
	},
	"Actuator":
	{
	}
};
