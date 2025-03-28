const User = require('../config/user.model.js');

const validateUser = async (req, res) => {
    try {
        if (req.session && req.session.user) {
            return res.status(200).json({ user: { id: req.session.user.id } });
        }

        return res.status(401).jsson({ message: "User not authenticated" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
const OAuth = async (req, res) => {
    try {
        const email = req.body.email;
        let user = await User.findOne({ email });
        if (!user) {
            const fullName = req.body.full_name;
            user = new User({ full_name: fullName, email });
            await user.save();
        }
        req.session.user = { id: user._id };

        return res.status(200).json({
            success: true,
            message: 'Sign in successfully',
            user: { id: user._id }
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: error.message });
    }
};

const signOut = async (req, res) => {
    try {
        if (!req.session) {
            return res.status(200).json({ message: 'No active session' });
        }

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed' });
            }

            res.cookie('connect.sid', '', {
                httpOnly: true,
                secure: false,
                sameSite: 'Strict',
                maxAge: 0
            });

            return res.status(200).json({ message: 'Logged out successfully' });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
    OAuth,
    validateUser,
    signOut,
}