import requests
import backoff
import json

REQUESTURL = "https://apis.roblox.com/assets/v1/assets"
RESPONSEURL = "https://apis.roblox.com/assets/v1/operations/"

class PostAssetRequests:
	def __init__(self, apiKey, userId, groupId):
		if not type(apiKey) is str:
			raise Exception("apiKey must be a string.")
		if not type(userId) is str and not type(groupId) is str:
			raise Exception("Either userId or groupId must be filled.")
		if userId:
			self.userId = "'userId': " + userId
		else:
			self.userId = "'groupId': " + groupId
		self.header = { 'x-api-key' : apiKey }

	def UploadFile(self, assetPath, assetType, name, description, contentType):
		file = { 'fileContent' : open(assetPath, 'rb') }
		data = {
			'request': "{ 'assetType': '" + assetType + "', 'displayName': '" + name + "', 'description': '" + description + "', 'creationContext': { 'creator': { " + self.userId + " } } }",
	      	'type': contentType
		}
		result = requests.post(REQUESTURL, data = data, headers = self.header, files = file)
		return result

	@backoff.on_exception(backoff.constant, ValueError, interval=7, max_tries=40)
	def GetAssetId(self, operationId):
		result = requests.get(RESPONSEURL + operationId, headers = self.header)
		resultAsJson = json.loads(result.content)
		if not result:
			print("Invalid response!")
			raise ValueError("Invalid response!")
		if not result.content:
			print("Response has no content!")
			raise ValueError("Response has no content!")
		if result.status_code != 200:
			print("Response has invalid code: " + str(result.status_code))
			raise ValueError("Response has invalid code: " + str(result.status_code))
		if resultAsJson["done"] == False:
			print("Operation has not been processed yet...")
			raise ValueError("Operation has not been processed yet... (retry)")
		else:
			return resultAsJson["response"]["assetId"]