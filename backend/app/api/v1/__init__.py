from flask import Blueprint

api_v1_bp = Blueprint('api_v1', __name__, url_prefix='/api/v1')

from . import auth
from . import farms
from . import crops
from . import crop_issues
from . import chat
from . import voice
from . import weather
from . import follow_ups
from . import notifications
from . import admin
from . import health
from . import uploads
